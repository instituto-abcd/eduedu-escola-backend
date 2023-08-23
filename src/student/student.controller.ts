import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentRequestDto } from './dto/request/create-student-request.dto';
import { DeleteStudentRequestDto } from './dto/request/delete-student-request.dto';
import { UpdateStudentRequestDto } from './dto/request/update-student-request.dto';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  EduException,
  ErrorDetails,
} from '../common/exceptions/edu-school.exception';
import { StudentResponseDto } from './dto/response/student-response.dto';
import { DeleteStudentResponseDto } from './dto/response/delete-student-response.dto';
import { InativeStudantRequestDto } from './dto/request/inative-studant-request.dto';
import { InativeStudentResponseDto } from './dto/response/inative-student-response.dto';
import { PaginationResponse } from '../common/pagination/pagination-response.dto';
import { AuditGuard } from 'src/common/guard/audit.guard';
import { PlanetTrackDto } from './dto/planet-track.dto';
import { StudentExamService } from './studentExam.service';
import { StudentAwardsResponseDto } from '../awards/dto/awards.dto';
import { AwardsService } from '../awards/awards.service';
import { AnswersResponseDto } from '../exam/dto/response/answers-response.dto';
import { AnswerRequestDto } from '../exam/dto/request/answers-request.dto';
import { QuestionDto } from '../exam/dto/question.dto';
import { ExamEvaluationResponseDto } from './dto/response/exam-evaluation-response.dto';
import { AuthorizeNewExamResponseDto } from './dto/request/authorize-new-exam-response.dto';
import { AuthorizeNewExamRequestDto } from './dto/request/authorize-new-exam-request.dto';
import { QuestionPlanentDto } from '../exam/dto/question-planet.dto';
import { AnswersPlanet } from './schemas/studentExam.schema';
import { AnswersPlanetResponseDto } from '../exam/dto/response/answers-planet-response.dto';
import { StudentExamDto } from './dto/studentexam.dto';
import { StudentResultService } from './studentResult.service';
import { StudentPlanetResultDetailDto } from './dto/student-planet-result-detail.dto';
import { StudentDetailedSummaryDto } from './student-detailed-summary.dto';

@Controller('student')
@ApiTags('Estudante')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly studentExamService: StudentExamService,
    private readonly awardsService: AwardsService,
    private readonly studentResultService: StudentResultService,
  ) {}

  @AuditGuard()
  @Post()
  @ApiResponse({
    status: 201,
    description: 'Estudante criado com sucesso',
    type: StudentResponseDto,
  })
  @ApiOperation({ summary: 'Criar um novo estudante' })
  create(
    @Body() createStudentDto: CreateStudentRequestDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.create(createStudentDto);
  }

  @Get('all')
  @ApiResponse({
    status: 200,
    description: 'Estudantes encontrados com sucesso',
    type: PaginationResponse,
  })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  @ApiResponse({
    status: ErrorDetails.INVALID_PAGINATION_PARAMETERS.status,
    description: ErrorDetails.INVALID_PAGINATION_PARAMETERS.message,
  })
  @ApiOperation({ summary: 'Obter todos os estudantes' })
  findAll(
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('name') name?: string,
    @Query('schoolClassName') schoolClassName?: string,
    @Query('schoolPeriod') schoolPeriod?: string,
    @Query('schoolGrade') schoolGrade?: string,
    @Query('cfo') cfo?: string,
    @Query('sea') sea?: string,
    @Query('lct') lct?: string,
    @Query('status') status?: string,
  ): Promise<PaginationResponse<StudentResponseDto>> {
    const pageNumber = parseInt(page || '1');
    const pageSize = parseInt(limit || '10');

    const filters = {
      name,
      schoolClassName,
      schoolPeriod,
      schoolGrade,
      cfo,
      sea,
      lct,
      status,
    };

    return this.studentService.findAll(pageNumber, pageSize, filters);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Estudante encontrado com sucesso',
    type: StudentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  @ApiOperation({ summary: 'Obter estudante por ID' })
  findOne(@Param('id') id: string): Promise<StudentResponseDto> {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Estudante atualizado com sucesso',
    type: StudentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  @ApiOperation({ summary: 'Atualizar estudante por ID' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentRequestDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.update(id, updateStudentDto);
  }

  @AuditGuard()
  @Delete()
  @ApiResponse({
    status: 200,
    description: 'Estudantes removidos com sucesso',
    type: DeleteStudentResponseDto,
  })
  @ApiOperation({ summary: 'Excluir estudantes' })
  remove(
    @Body() requestDto: DeleteStudentRequestDto,
  ): Promise<DeleteStudentResponseDto> {
    const { ids } = requestDto;
    return this.studentService.delete(ids);
  }

  @Post('inactivate')
  @ApiOperation({ summary: 'Desativar estudantes' })
  @ApiResponse({
    status: 200,
    description: 'Estudantes desativados com sucesso',
    type: InativeStudentResponseDto,
  })
  async deactivateStudents(
    @Body() requestDto: InativeStudantRequestDto,
  ): Promise<InativeStudentResponseDto> {
    return this.studentService.deactivateStudants(requestDto);
  }

  @Get('/:id/planet-track')
  @ApiResponse({
    status: 200,
    description: 'Rota do planeta recuperada com sucesso',
    type: PlanetTrackDto,
  })
  @ApiBadRequestResponse({ description: 'Requsição inválida' })
  @ApiResponse({
    status: ErrorDetails.STUDENT_NOT_FOUND.status,
    description: ErrorDetails.STUDENT_NOT_FOUND.message,
  })
  @ApiOperation({ summary: 'Obtenha a trilha do planeta para um aluno' })
  async getPlanetTrack(
    @Param('id') studentId: string,
  ): Promise<PlanetTrackDto> {
    return this.studentExamService.getPlanetTrack(studentId);
  }

  @Get('/:id/awards')
  @ApiOperation({ summary: 'Obter os prêmios do estudante pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lista de prêmios do estudante',
    type: StudentAwardsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  @ApiResponse({
    status: ErrorDetails.STUDENT_NOT_FOUND.status,
    description: ErrorDetails.STUDENT_NOT_FOUND.message,
  })
  async getStudentAwards(
    @Param('id') studentId: string,
  ): Promise<StudentAwardsResponseDto> {
    try {
      const awards = await this.awardsService.getStudentAwards(studentId);
      return { awards };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new EduException('STUDENT_NOT_FOUND');
      } else {
        throw new EduException('UNKNOWN_ERROR');
      }
    }
  }

  @Get(':id/exam-questions/first')
  @ApiResponse({
    status: 200,
    description: 'Recuperar próxima questão para o estudante',
    type: StudentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  @ApiOperation({ summary: 'Obter estudante por ID' })
  getFirstQuestionForStudent(@Param('id') id: string): Promise<any> {
    return this.studentService.getFirstQuestionForStudent(id);
  }

  @Post('/:id/exam-questions/:examId/answer')
  @ApiOperation({ summary: 'Responder questão da prova' })
  @ApiResponse({
    status: 201,
    description: 'Resposta do estudante enviada com sucesso',
    type: StudentResponseDto,
  })
  async answer(
    @Param('id') studentId: string,
    @Param('examId') examId: string,
    @Body() answerRequestDto: AnswerRequestDto,
  ): Promise<QuestionDto | AnswersResponseDto> {
    return this.studentService.answer(studentId, examId, answerRequestDto);
  }

  @Post(':id/exam-evaluation')
  @ApiResponse({
    status: 201,
    description: 'Submete a avaliação da prova do aluno',
    type: ExamEvaluationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  @ApiOperation({ summary: 'Submete a avaliação da prova do aluno' })
  evaluation(@Param('id') id: string): Promise<any> {
    return this.studentService.handleExamEvaluation(id);
  }

  @Post('authorize-new-exam')
  @ApiOperation({ summary: 'Autorizar novo exame' })
  @ApiResponse({
    status: 200,
    description: 'Nova prova liberada para os Estudantes',
    type: AuthorizeNewExamResponseDto,
  })
  async authorizeNewExam(
    @Body() requestDto: AuthorizeNewExamRequestDto,
  ): Promise<AuthorizeNewExamResponseDto> {
    return this.studentService.authorizeNewExam(requestDto);
  }

  @Get(':id/planets/:planetId/first-question')
  @ApiResponse({
    status: 200,
    description: 'Retrieve the next question of the planet for the student',
    type: StudentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Student not found' })
  @ApiOperation({ summary: 'Get student by ID' })
  async getFirstQuestionPlanetForStudent(
    @Param('id') id: string,
    @Param('planetId') planetId: string,
  ): Promise<QuestionPlanentDto> {
    return await this.studentService.getFirstQuestionPlanetForStudent(
      id,
      planetId,
    );
  }

  @Post(':id/planets/:planetId/answer')
  @ApiOperation({ summary: 'Responder questão da prova' })
  @ApiResponse({
    status: 201,
    description: 'Resposta do estudante enviada com sucesso',
    type: StudentResponseDto,
  })
  async answerPlanet(
    @Param('id') studentId: string,
    @Param('planetId') planetId: string,
    @Body() answerPlanetRequestDto: AnswersPlanet,
  ): Promise<AnswersPlanetResponseDto | QuestionPlanentDto> {
    const response = await this.studentService.answerPlanet(
      studentId,
      planetId,
      answerPlanetRequestDto,
    );

    return response;
  }

  @Get(':id/exam-executions')
  @ApiResponse({
    status: 200,
    description: 'Obtém as execuções de prova de um aluno',
    type: StudentResponseDto,
  })
  @ApiOperation({ summary: 'Obtém as execuções de prova de um aluno' })
  async getExamExecutions(
    @Param('id') id: string,
  ): Promise<StudentExamDto[]> {
    return await this.studentExamService.getStudentExams(id);
  }

  @Get(':id/exam-executions/:studentExamId/planets-detail')
  @ApiResponse({
    status: 200,
    description: 'Obtém os sumarizados por eixo, com a lista de planetas',
    type: StudentResponseDto,
  })
  @ApiOperation({ summary: 'Obtém os sumarizados por eixo, com a lista de planetas' })
  async getExamExecution(
    @Param('id') id: string,
    @Param('studentExamId') studentExamId: string,
    @Query('loadPlanets') loadPlanets: boolean,
  ): Promise<StudentPlanetResultDetailDto[]> {
    return await this.studentResultService.getStudentPlanetsResultDetail(studentExamId, loadPlanets);
  }

  @Get(':id/detailed-summary')
  @ApiResponse({
    status: 200,
    description: 'Obtém os resultados e resumos de prova por eixo de um aluno',
    type: StudentResponseDto,
  })
  @ApiOperation({ summary: 'Obtém os resultados e resumos de prova por eixo de um aluno' })
  async getStudentDetailedSummary(
    @Param('id') id: string,
  ): Promise<StudentDetailedSummaryDto> {
    return await this.studentResultService.getStudentDetailedSummary(id);
  }
}
