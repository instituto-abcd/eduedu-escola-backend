import { Controller, Get } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SyncExamResponse } from './dto/sync-success.dto';
import { QuestionPlanentDto } from './dto/question-planet.dto';

@Controller('exam')
@ApiTags('Prova')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  @ApiOperation({
    summary: 'Sincronizar provas do Firestore',
    description:
      'Essa chamada vai copiar a prova que está no Firestore e duplicá-la no MongoDB local da aplicação EduEdu',
  })
  @ApiOkResponse({
    description: 'Status da operação',
    type: SyncExamResponse,
  })
  async syncExam() {
    return await this.examService.syncExams();
  }

  @Get('/questions')
  @ApiOperation({
    summary: 'Obter questões da prova',
  })
  @ApiOkResponse({
    type: QuestionPlanentDto,
  })
  async getExamQuestions() {
    return await this.examService.getExamQuestions();
  }
}
