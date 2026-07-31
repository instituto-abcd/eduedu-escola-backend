import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BackupSchedule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BackupService } from './backup.service';
import {
  DEFAULT_BACKUP_SCHEDULE,
  RETRY_DELAY_MS,
  RUN_LOCK_TIMEOUT_MS,
  SCHEDULE_CHECK_CRON,
  SCHEDULE_TIME_ZONE,
  STARTUP_GRACE_MS,
} from './backup-schedule.constants';
import {
  isScheduleDue,
  lastScheduledSlot,
  nextScheduledSlot,
} from './backup-schedule.slot';
import { BackupScheduleResponseDto } from './dto/backup-schedule-response.dto';
import { UpdateBackupScheduleDto } from './dto/update-backup-schedule.dto';

/**
 * Backup automático semanal.
 *
 * O agendamento não é um cron no dia escolhido, e sim uma verificação
 * periódica de atraso (ver `SCHEDULE_CHECK_CRON` e `lastScheduledSlot`). A
 * diferença importa porque estas máquinas vivem desligadas ou desconectadas:
 * um cron em "domingo às 02:00" simplesmente não acontece se o computador
 * estiver desligado no domingo, e o backup daquela semana some sem aviso.
 * Perguntando "já passei do horário desta semana sem fazer backup?", o backup
 * atrasado acontece na primeira vez que a máquina for ligada.
 *
 * Nada aqui depende de internet: o `pg_dump`/`mongodump` e o zip são todos
 * locais. Uma máquina permanentemente offline faz backup normalmente.
 */
@Injectable()
export class BackupScheduleService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BackupScheduleService.name);
  private readonly processStartedAt = new Date();
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly backupService: BackupService,
  ) {}

  async onApplicationBootstrap() {
    try {
      const schedule = await this.getSchedule();
      this.backupService.cleanupUnfinishedBackups();
      await this.releaseStaleLock(schedule);
      this.logger.log(this.describe(schedule));
    } catch (error) {
      // Uma falha aqui não pode impedir a aplicação de subir: a escola
      // continua usando o sistema sem backup automático, e a próxima
      // verificação periódica tenta de novo.
      this.logger.error(
        `Não foi possível inicializar o backup automático: ${this.errorMessage(
          error,
        )}`,
      );
    }
  }

  @Cron(SCHEDULE_CHECK_CRON)
  async checkSchedule(): Promise<void> {
    await this.runIfDue('verificação periódica');
  }

  async getSchedule(): Promise<BackupSchedule> {
    const existing = await this.prisma.backupSchedule.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (existing) return existing;

    return this.prisma.backupSchedule.create({
      data: DEFAULT_BACKUP_SCHEDULE,
    });
  }

  async getScheduleResponse(): Promise<BackupScheduleResponseDto> {
    return this.toResponse(await this.getSchedule());
  }

  async updateSchedule(
    dto: UpdateBackupScheduleDto,
  ): Promise<BackupScheduleResponseDto> {
    const current = await this.getSchedule();

    const data: Partial<BackupSchedule> = {};

    if (dto.enabled !== undefined) {
      data.enabled = dto.enabled;
    }

    if (dto.dayOfWeek !== undefined) {
      data.dayOfWeek = this.validateRange(dto.dayOfWeek, 0, 6, 'dia da semana');
    }

    if (dto.hour !== undefined) {
      data.hour = this.validateRange(dto.hour, 0, 23, 'hora');
    }

    if (dto.minute !== undefined) {
      data.minute = this.validateRange(dto.minute, 0, 59, 'minuto');
    }

    if (dto.retentionCount !== undefined) {
      data.retentionCount = this.validateRange(
        dto.retentionCount,
        1,
        52,
        'quantidade de backups mantidos',
      );
    }

    const updated = await this.prisma.backupSchedule.update({
      where: { id: current.id },
      data,
    });

    this.logger.log(this.describe(updated));

    // A troca de dia/hora não precisa reagendar nada: a verificação
    // periódica passa a comparar com a nova janela na execução seguinte.
    return this.toResponse(updated);
  }

  private toResponse(schedule: BackupSchedule): BackupScheduleResponseDto {
    const now = new Date();

    return {
      enabled: schedule.enabled,
      dayOfWeek: schedule.dayOfWeek,
      hour: schedule.hour,
      minute: schedule.minute,
      retentionCount: schedule.retentionCount,
      timeZone: SCHEDULE_TIME_ZONE,
      lastRunAt: schedule.lastRunAt,
      lastRunFile: schedule.lastRunFile,
      lastError: schedule.lastError,
      nextRunAt: schedule.enabled
        ? nextScheduledSlot(now, schedule, SCHEDULE_TIME_ZONE)
        : null,
      overdue: isScheduleDue(now, schedule, SCHEDULE_TIME_ZONE),
      running: this.isLockedByAnotherRun(schedule, now),
    };
  }

  /**
   * Roda o backup se a janela da semana já passou sem backup. Idempotente e
   * seguro de chamar com qualquer frequência — é o único caminho de execução
   * automática.
   */
  async runIfDue(trigger: string): Promise<void> {
    if (this.isRunning) return;

    const schedule = await this.getSchedule();
    const now = new Date();

    if (!isScheduleDue(now, schedule, SCHEDULE_TIME_ZONE)) return;

    if (now.getTime() - this.processStartedAt.getTime() < STARTUP_GRACE_MS) {
      this.logger.log(
        'Backup automático em atraso; aguardando a carência de inicialização para não concorrer com a subida da aplicação.',
      );
      return;
    }

    if (this.isLockedByAnotherRun(schedule, now)) {
      this.logger.warn(
        `Backup automático em atraso, mas há uma execução em andamento desde ${this.format(
          schedule.runningSince,
        )}. Nada a fazer agora.`,
      );
      return;
    }

    if (this.isWaitingRetry(schedule, now)) {
      this.logger.warn(
        `Backup automático em atraso, mas a última tentativa (${this.format(
          schedule.lastAttemptAt,
        )}) falhou: ${
          schedule.lastError
        }. Nova tentativa depois do intervalo de espera.`,
      );
      return;
    }

    await this.run(schedule, trigger, now);
  }

  private async run(
    schedule: BackupSchedule,
    trigger: string,
    now: Date,
  ): Promise<void> {
    this.isRunning = true;

    try {
      await this.prisma.backupSchedule.update({
        where: { id: schedule.id },
        data: { runningSince: now, lastAttemptAt: now },
      });

      this.logger.log(
        `Iniciando backup automático (${trigger}); janela prevista era ${this.format(
          lastScheduledSlot(now, schedule, SCHEDULE_TIME_ZONE),
        )}.`,
      );

      const fileName = await this.backupService.createBackup();

      await this.prisma.backupSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: new Date(),
          lastRunFile: fileName,
          lastError: null,
          runningSince: null,
        },
      });

      this.logger.log(`Backup automático concluído: ${fileName}.`);

      // Depois de dar o backup como feito, e em um try próprio: a limpeza é
      // manutenção de disco, e falhar nela não pode marcar como fracassado um
      // backup que está gravado — senão a semana inteira seria retentada por
      // causa de um arquivo antigo que não deu para apagar.
      this.pruneOldBackups(schedule.retentionCount);
    } catch (error) {
      await this.recordFailure(schedule, error);
    } finally {
      this.isRunning = false;
    }
  }

  private pruneOldBackups(retentionCount: number): void {
    try {
      const removed = this.backupService.pruneBackups(retentionCount);

      if (removed.length) {
        this.logger.log(`Backups antigos removidos: ${removed.join(', ')}.`);
      }
    } catch (error) {
      this.logger.warn(
        `Não foi possível limpar os backups antigos: ${this.errorMessage(
          error,
        )}`,
      );
    }
  }

  /**
   * Registra a falha sem marcar `lastRunAt`: o backup continua em atraso e
   * será tentado de novo depois de `RETRY_DELAY_MS`. A mensagem fica no banco
   * porque um backup automático que falha de madrugada não tem ninguém para
   * ver a notificação — a tela de Configurações mostra esse último erro.
   */
  private async recordFailure(
    schedule: BackupSchedule,
    error: unknown,
  ): Promise<void> {
    const message = this.errorMessage(error);
    this.logger.error(`Falha no backup automático: ${message}`);

    try {
      await this.prisma.backupSchedule.update({
        where: { id: schedule.id },
        data: { lastError: message, runningSince: null },
      });
    } catch (updateError) {
      this.logger.error(
        `Falha ao registrar o erro do backup automático: ${this.errorMessage(
          updateError,
        )}`,
      );
    }
  }

  private isLockedByAnotherRun(schedule: BackupSchedule, now: Date): boolean {
    if (!schedule.runningSince) return false;

    return (
      now.getTime() - schedule.runningSince.getTime() < RUN_LOCK_TIMEOUT_MS
    );
  }

  private isWaitingRetry(schedule: BackupSchedule, now: Date): boolean {
    if (!schedule.lastError || !schedule.lastAttemptAt) return false;

    return now.getTime() - schedule.lastAttemptAt.getTime() < RETRY_DELAY_MS;
  }

  /**
   * Limpa um `runningSince` órfão na inicialização. Se o processo está subindo
   * agora, qualquer backup marcado como em andamento é de uma execução que
   * morreu no meio — típico de máquina desligada durante o backup.
   */
  private async releaseStaleLock(schedule: BackupSchedule): Promise<void> {
    if (!schedule.runningSince) return;

    this.logger.warn(
      `Havia um backup automático marcado como em andamento desde ${this.format(
        schedule.runningSince,
      )}, interrompido antes de terminar. Liberando para uma nova tentativa.`,
    );

    await this.prisma.backupSchedule.update({
      where: { id: schedule.id },
      data: {
        runningSince: null,
        lastError: 'Backup interrompido antes de terminar',
      },
    });
  }

  private validateRange(
    value: number,
    min: number,
    max: number,
    label: string,
  ): number {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new BadRequestException(
        `Valor inválido para ${label}: informe um número inteiro entre ${min} e ${max}`,
      );
    }

    return value;
  }

  private describe(schedule: BackupSchedule): string {
    if (!schedule.enabled) {
      return 'Backup automático desativado.';
    }

    const time = `${String(schedule.hour).padStart(2, '0')}:${String(
      schedule.minute,
    ).padStart(2, '0')}`;

    return `Backup automático ativo: ${
      WEEKDAY_LABELS[schedule.dayOfWeek]
    } às ${time} (${SCHEDULE_TIME_ZONE}). Último backup: ${
      schedule.lastRunAt ? this.format(schedule.lastRunAt) : 'nenhum'
    }.`;
  }

  private format(date: Date | null): string {
    return date ? date.toISOString() : '-';
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

const WEEKDAY_LABELS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];
