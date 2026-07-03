import {
  Controller,
  Get,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SyncExamResponse } from './dto/sync-success.dto';
import { QuestionPlanentDto } from './dto/question-planet.dto';
import { LastExamSyncResponseDto } from './dto/last-exam-sync-response.dto';

@Controller('exam')
@ApiTags('Prova')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Sincronizar provas (assets e dados) - Enfileira em background',
    description:
      'Enfileira a sincronizacao de provas para execucao em background. Baixa os assets de prova do endpoint /asset/exam, extrai para assets-data-exam/, e sincroniza dados das provas do Firestore para o MongoDB local.',
  })
  @ApiOkResponse({
    description: 'Status da operacao',
    type: SyncExamResponse,
  })
  async syncExam() {
    try {
      await this.examService.enqueueSyncExams();
      return {
        message: 'Sincronizacao de provas enfileirada.',
        status: 202,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Falha ao enfileirar sincronizacao de provas: ' + error.message,
      );
    }
  }

  @Post('force-sync')
  @ApiOperation({
    summary: 'Sincronizar provas de forma sincrona (ignora fila)',
    description:
      'Executa a sincronizacao de provas de forma sincrona, sem usar a fila.',
  })
  @ApiOkResponse({
    description: 'Status da operacao',
    type: SyncExamResponse,
  })
  async forceSyncExam() {
    return await this.examService.fullSyncExams();
  }

  @Get('sync-status')
  @ApiOperation({
    summary: 'Status da operacao de sincronizacao de provas',
  })
  getExamSyncStatus() {
    return this.examService.getExamSyncStatus();
  }

  @Get('last-sync')
  @ApiOperation({ summary: 'Ultima data de sincronizacao de provas' })
  @ApiOkResponse({ type: LastExamSyncResponseDto })
  getLastExamSync(): Promise<LastExamSyncResponseDto> {
    return this.examService.getLastExamSync();
  }

  @Get('/questions')
  @ApiOperation({
    summary: 'Obter questoes da prova',
  })
  @ApiOkResponse({
    type: QuestionPlanentDto,
  })
  async getExamQuestions() {
    return await this.examService.getExamQuestions();
  }
}
