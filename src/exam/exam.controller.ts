import { Controller, Get, UseGuards } from '@nestjs/common';
import { ExamService } from './exam.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SyncExamResponse } from './dto/sync-success.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('exam')
@ApiTags('Prova')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  @ApiOperation({
    summary: 'Sincronizar provas do Firestore',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da operação',
    type: SyncExamResponse,
  })
  async syncExam() {
    return await this.examService.syncExams();
  }

  @Get('/questions')
  @ApiOperation({
    summary: 'Obter questões da prova atual',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da operação',
  })
  async getExamQuestions() {
    return await this.examService.getExamQuestions();
  }
}
