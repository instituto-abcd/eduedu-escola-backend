import { Controller, Get } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncExamResponse } from './dto/sync-success.dto';

@Controller('exam')
@ApiTags('Prova')
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

  @Get("/questions")
  @ApiOperation({
    summary: 'Obter questões da prova atual',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da operação'
  })
  async getExamQuestions() {
    return await this.examService.getExamQuestions();
  }

}
