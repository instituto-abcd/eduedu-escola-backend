import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Put,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { basename } from 'path';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { BackupScheduleService } from './backup-schedule.service';
import { BackupScheduleResponseDto } from './dto/backup-schedule-response.dto';
import { UpdateBackupScheduleDto } from './dto/update-backup-schedule.dto';
import { DirectorAuthGuard } from '../auth/guard/director-auth.guard';

const MAX_RESTORE_FILE_SIZE = 500 * 1024 * 1024;

@ApiTags('Backup')
@Controller('backup')
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly backupScheduleService: BackupScheduleService,
  ) {}

  @Get('schedule')
  @ApiOperation({ summary: 'Agendamento do backup automático semanal' })
  @ApiOkResponse({ type: BackupScheduleResponseDto })
  @UseGuards(DirectorAuthGuard)
  @ApiBearerAuth()
  async getSchedule(): Promise<BackupScheduleResponseDto> {
    return this.backupScheduleService.getScheduleResponse();
  }

  @Put('schedule')
  @ApiOperation({
    summary: 'Atualizar o agendamento do backup automático semanal',
    description:
      'A alteração vale a partir da próxima verificação, sem reiniciar a aplicação.',
  })
  @ApiOkResponse({ type: BackupScheduleResponseDto })
  @UseGuards(DirectorAuthGuard)
  @ApiBearerAuth()
  async updateSchedule(
    @Body() updateBackupScheduleDto: UpdateBackupScheduleDto,
  ): Promise<BackupScheduleResponseDto> {
    return this.backupScheduleService.updateSchedule(updateBackupScheduleDto);
  }

  @Get('files')
  @ApiOperation({
    summary: 'Backups disponíveis nesta máquina, do mais recente para o mais antigo',
  })
  @ApiOkResponse({ type: [String], description: 'Nomes dos arquivos .zip' })
  @UseGuards(DirectorAuthGuard)
  @ApiBearerAuth()
  async listBackups(): Promise<string[]> {
    return this.backupService.listBackupFiles();
  }

  // Sem esta rota o .zip nao tem como sair da maquina: ele e escrito dentro
  // do container do backend, e no setup a pasta nao e volume — o arquivo
  // morre no proximo `docker compose down` (toda atualizacao recria o
  // container) e a retencao apaga os antigos antes de alguem ve-los.
  @Get('files/:fileName')
  @ApiOperation({ summary: 'Baixar um arquivo de backup' })
  @Header('Content-Type', 'application/zip')
  @UseGuards(DirectorAuthGuard)
  @ApiBearerAuth()
  async downloadBackup(
    @Param('fileName') fileName: string,
  ): Promise<StreamableFile> {
    const filePath = this.backupService.resolveBackupFile(fileName);

    return new StreamableFile(createReadStream(filePath), {
      type: 'application/zip',
      disposition: `attachment; filename="${basename(filePath)}"`,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Criar backup do banco de dados atual' })
  @ApiOkResponse({
    type: String,
    description: 'Nome do arquivo .zip gerado',
  })
  @UseGuards(DirectorAuthGuard)
  @ApiBearerAuth()
  async createBackup(): Promise<string> {
    return this.backupService.createBackup();
  }

  @Post('restore')
  @ApiOperation({
    summary: 'Restaurar o banco de dados a partir de um arquivo de backup .zip',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ description: 'Backup restaurado com sucesso' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_RESTORE_FILE_SIZE } }),
  )
  @UseGuards(DirectorAuthGuard)
  @ApiBearerAuth()
  async restoreBackup(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean }> {
    if (!file) {
      throw new BadRequestException('Arquivo de backup é obrigatório');
    }

    if (!file.originalname.toLowerCase().endsWith('.zip')) {
      throw new BadRequestException('O arquivo de backup deve ser um .zip');
    }

    return this.backupService.restoreBackup(file);
  }
}
