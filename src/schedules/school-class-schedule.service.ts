import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolClassScheduleService {
  private readonly logger = new Logger(SchoolClassScheduleService.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron('59 23 * * *') // Agendamento para 23:59 todos os dias
  async updateSchoolClassStudents() {
    try {
      await this.prisma.schoolClassStudent.updateMany({
        data: {
          reserved: false,
        },
      });
      this.logger.log(`Reservas dos alunos canceladas com sucesso.`);
    } catch (error) {
      this.logger.error(
        'Ocorreu um erro ao cancelar as reservas dos alunos.',
        error,
      );
    }
  }

  async updateSchoolClassStudentsStartApp() {
    try {
      await this.prisma.schoolClassStudent.updateMany({
        data: {
          reserved: false,
        },
      });
      this.logger.log(
        `Reservas dos alunos foram canceladas com êxito durante a inicialização do sistema.`,
      );
    } catch (error) {
      this.logger.error(
        'Houve um problema ao cancelar as reservas dos alunos durante o início do sistema.',
        error,
      );
    }
  }
}
