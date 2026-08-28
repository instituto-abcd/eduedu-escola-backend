import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { DirectorAuthGuard } from '../auth/guard/director-auth.guard';

const MAX_RESTORE_FILE_SIZE = 500 * 1024 * 1024;

@ApiTags('Backup')
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

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
