import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentRequestDto } from './dto/request/create-student-request.dto';
import { DeleteStudentRequestDto } from './dto/request/delete-student-request.dto';
import { UpdateStudentRequestDto } from './dto/request/update-student-request.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
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
import { AuditGuard } from '../common/guard/audit.guard';
import { PlanetTrackDto } from './dto/planet-track.dto';
import { StudentExamService } from './studentExam.service';
import { AwardDto } from '../awards/dto/awards.dto';
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
import { ChartStudentResponse } from './dto/response/chart-studant-response.dto';
import { StudentDetailedSummaryDto } from './student-detailed-summary.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { StudentPlanetStarsDto } from './student-planet-stars.dto';
import { ReservedStudentRequestDto } from './dto/request/reserved-student-request.dto';
import { UpdateStudentReservedResponseDto } from './dto/response/update-student-reserved-response';
import { ApiPaginatedResponse } from 'src/common/pagination/pagination-decorator';

@Controller('student')
@ApiTags('Alunos')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly studentExamService: StudentExamService,
    private readonly awardsService: AwardsService,
    private readonly studentResultService: StudentResultService,
  ) {}

  @Post('sync-planet-student')
  @ApiOperation({
    summary: '[ ? ] [NÃO UTILIZADO] Sincronizar Trilha de Planetas do Aluno',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async syncPlanetStudent(): Promise<any> {
    return await this.studentService.syncPlanetStudent();
  }

  @Post('sync-planets-by-student/:studentId')
  @ApiOperation({
    summary: '[ ? ] [NÃO UTILIZADO] Sincronizar Trilha de Planetas por Aluno',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async syncPlanetByStudent(
    @Param('studentId') studentId: string,
  ): Promise<any> {
    return await this.studentService.syncPlanetByStudent(studentId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @AuditGuard()
  @ApiOperation({ summary: 'Criar aluno' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  create(
    @Body() createStudentDto: CreateStudentRequestDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.create(createStudentDto);
  }

  @Get('all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiPaginatedResponse(StudentResponseDto)
  @ApiOperation({ summary: 'Listar alunos', deprecated: true })
  findAll(
    @Req() req,
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
    const user = req.user;

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

    return this.studentService.findAll(pageNumber, pageSize, filters, user);
  }

  @Get('all-no-auth')
  @ApiPaginatedResponse(StudentResponseDto)
  @ApiOperation({
    summary: 'Listar alunos (não autenticado)',
    description:
      'Usado no portal aluno para popular a lista de alunos sem necessitar de um token de usuaário autenticado. O endpoint `GET /all` foi depreciado em favor deste, mas ambos são indênticos.',
  })
  findAllNoAuth(
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('name') name?: string,
    @Query('initialLetter') initialLetter?: string,
    @Query('schoolClassId') schoolClassId?: string,
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
      initialLetter,
      schoolClassId,
      schoolClassName,
      schoolPeriod,
      schoolGrade,
      cfo,
      sea,
      lct,
      status,
    };

    return this.studentService.findAllNoAuth(pageNumber, pageSize, filters);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  @ApiOperation({ summary: 'Buscar aluno por ID' })
  findOne(@Param('id') id: string): Promise<StudentResponseDto> {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ type: StudentResponseDto })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  @ApiOperation({ summary: 'Atualizar aluno por ID' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentRequestDto,
  ): Promise<StudentResponseDto> {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete()
  @AuditGuard()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ type: DeleteStudentResponseDto })
  @ApiOperation({ summary: 'Excluir estudantes' })
  remove(
    @Body() requestDto: DeleteStudentRequestDto,
  ): Promise<DeleteStudentResponseDto> {
    const { ids } = requestDto;
    return this.studentService.delete(ids);
  }

  @Post('inactivate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[NÃO UTILIZADO] Inativar alunos' })
  @ApiResponse({ type: InativeStudentResponseDto })
  async deactivateStudents(
    @Body() requestDto: InativeStudantRequestDto,
  ): Promise<InativeStudentResponseDto> {
    return this.studentService.deactivateStudants(requestDto);
  }

  @Get('/:id/planet-track')
  @ApiOkResponse({ type: PlanetTrackDto })
  @ApiOperation({ summary: 'Obtenha a trilha do planeta para um aluno' })
  @ApiQuery({
    name: 'usePlanetAvailability',
    description: 'Considerar disponibilidade de planeta',
    type: Boolean,
    required: false,
  })
  @ApiQuery({
    name: 'hideLastPlanets',
    description: 'Ocultar últimos planetas',
    type: Boolean,
    required: false,
  })
  @ApiQuery({
    name: 'canExecuteAnyPlanet',
    description: 'Possibilidade de executar qualquer planeta listado',
    type: Boolean,
    required: false,
  })
  async getPlanetTrack(
    @Param('id') studentId: string,
    @Query(
      'usePlanetAvailability',
      new DefaultValuePipe(true),
      new ParseBoolPipe(),
    )
    usePlanetAvailability: boolean,
    @Query('hideLastPlanets', new DefaultValuePipe(true), new ParseBoolPipe())
    hideLastPlanets: boolean,
    @Query(
      'canExecuteAnyPlanet',
      new DefaultValuePipe(false),
      new ParseBoolPipe(),
    )
    canExecuteAnyPlanet: boolean,
  ): Promise<PlanetTrackDto> {
    return this.studentExamService.getPlanetTrack(
      studentId,
      usePlanetAvailability,
      hideLastPlanets,
      canExecuteAnyPlanet,
    );
  }

  @Put('/:id/release-planets')
  @ApiOperation({
    summary: 'Marca planetas como disponíveis na trilha do aluno',
    description:
      'A operação é realizada manualmente no portal Admin, na listagem de alunos',
  })
  async releasePlanets(
    @Param('id') studentId: string,
  ): Promise<PlanetTrackDto> {
    return this.studentService.releasePlanets(studentId);
  }

  @Get('/:id/awards')
  @ApiOperation({ summary: 'Lista conquistas do aluno' })
  @ApiResponse({ type: AwardDto, isArray: true })
  async getStudentAwards(@Param('id') studentId: string): Promise<AwardDto[]> {
    try {
      return await this.awardsService.getStudentAwards(studentId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new EduException('STUDENT_NOT_FOUND');
      } else {
        throw new EduException('UNKNOWN_ERROR');
      }
    }
  }

  @Patch(':id/reserved')
  @ApiOperation({
    summary: 'Marcar aluno como reservado',
    description:
      'Usado para bloquear um aluno de estar aberto em mais de um computador ao mesmo tempo',
  })
  @ApiOkResponse({ type: UpdateStudentReservedResponseDto })
  async updateStudentReserved(
    @Param('id') id: string,
    @Body() requestDto: ReservedStudentRequestDto,
  ): Promise<UpdateStudentReservedResponseDto> {
    return await this.studentService.updateStudentReserved(
      id,
      requestDto.reserved,
    );
  }

  @Get(':id/exam-questions/first')
  @ApiOperation({
    summary: 'Primeira questão da prova',
    description:
      'Usado para dar iniciação a prova com a primeira questão, para as demais questões deve-se usar o `/:studentId/exam-questions/:examId/answer` enviando um objeto de resposta desta questão',
  })
  @ApiOkResponse({ type: QuestionDto })
  getFirstQuestionForStudent(@Param('id') id: string): Promise<QuestionDto> {
    return this.studentService.getFirstQuestionForStudent(id);
  }

  @Post('/:id/exam-questions/:examId/answer')
  @ApiOperation({
    summary: 'Responder questão da prova',
    description:
      'Retorna a próxima questão OU objeto que identifica o fim da prova',
  })
  @ApiCreatedResponse({ type: QuestionDto })
  async answer(
    @Param('id') studentId: string,
    @Param('examId') examId: string,
    @Body() answerRequestDto: AnswerRequestDto,
  ): Promise<QuestionDto | AnswersResponseDto> {
    return this.studentService.answer(studentId, examId, answerRequestDto);
  }

  @Post(':id/exam-evaluation')
  @ApiOperation({
    summary: 'Submete a avaliação da prova do aluno',
    description:
      'Ao fim da prova, o portal aluno chama esta rota pra gerar o resultado da prova',
  })
  @ApiCreatedResponse({ type: ExamEvaluationResponseDto })
  evaluation(@Param('id') id: string): Promise<any> {
    return this.studentService.handleExamEvaluation(id);
  }

  @Post('authorize-new-exam')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Liberar prova' })
  @ApiOkResponse({ type: AuthorizeNewExamResponseDto })
  async authorizeNewExam(
    @Body() requestDto: AuthorizeNewExamRequestDto,
  ): Promise<AuthorizeNewExamResponseDto> {
    return this.studentService.authorizeNewExam(requestDto);
  }

  @Get(':id/planets/:planetId/first-question')
  @ApiCreatedResponse({ type: QuestionDto })
  @ApiOperation({
    summary: 'Primeira questão de um planeta',
    description:
      'Assim como as rotas de prova, esse endpoint deve ser usado para dar início a execução de um planeta, e a resposta deste e demais questões serão tratadas no endpoint `:studentId/planets/:planetId/answer`',
  })
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
  @ApiOperation({ summary: 'Responder questão do planeta' })
  @ApiCreatedResponse({ type: QuestionDto })
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
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiOperation({ summary: 'Lista datas de execuções de prova do aluno' })
  async getExamExecutions(@Param('id') id: string): Promise<StudentExamDto[]> {
    return await this.studentExamService.getStudentExams(id);
  }

  @Get(':id/exam-executions/:studentExamId/planets-performance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: StudentPlanetResultDetailDto })
  @ApiOperation({
    summary: '[?] Desempenho do aluno em planetas agrupados por eixo',
  })
  async getExamExecution(
    @Param('id') id: string,
    @Param('studentExamId') studentExamId: string,
    @Query('loadPlanets') loadPlanets: boolean,
  ): Promise<StudentPlanetResultDetailDto[]> {
    return await this.studentResultService.getStudentPlanetsResultDetail(
      studentExamId,
      loadPlanets,
    );
  }

  // Card Gráfico Desempenho do Aluno Por Planetas - Endpoint de Retorno dos dados do gráfico
  @Get(':id/planets-chart')
  @ApiOkResponse({ type: ChartStudentResponse })
  @ApiOperation({
    summary:
      'Dados para o gráfico de desempenho por eixo, com a lista de planetas',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async planetsChart(@Param('id') id: string): Promise<ChartStudentResponse> {
    return await this.studentResultService.planetsChart(id);
  }

  @Get(':id/exams-chart')
  @ApiOkResponse({ type: ChartStudentResponse })
  @ApiOperation({
    summary:
      'Dados para o gráfico de desempenho por eixo, com a lista de provas',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async examsChart(@Param('id') id: string): Promise<ChartStudentResponse> {
    return await this.studentResultService.examsChart(id);
  }

  @Get(':id/detailed-summary')
  @ApiOkResponse({ type: StudentDetailedSummaryDto })
  @ApiOperation({ summary: 'Resultados de prova por eixo' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getStudentDetailedSummary(
    @Param('id') id: string,
  ): Promise<StudentDetailedSummaryDto> {
    return await this.studentResultService.getStudentDetailedSummary(id);
  }

  @Get(':id/planets/:planetId')
  @ApiResponse({
    status: 200,
    description: 'Obtém as estrelas do aluno no planeta',
    type: StudentPlanetStarsDto,
  })
  @ApiOperation({
    summary: 'Obtém as estrelas do aluno no planeta',
  })
  async studentPlanetStars(
    @Param('id') id: string,
    @Param('planetId') planetId: string,
  ): Promise<StudentPlanetStarsDto> {
    return await this.studentResultService.studentPlanetStars(id, planetId);
  }

  @Get('find-level/:studentId')
  @ApiOperation({ summary: 'Níveis de um aluno por eixo' })
  async getStudentLevels(
    @Param('studentId') studentId: string,
  ): Promise<{ levelLC: string; levelEA: string; levelES: string }> {
    try {
      const levels = await this.studentService.getStudentLevels(studentId);
      if (!levels) {
        throw new NotFoundException('Estudante não encontrado');
      }
      return levels;
    } catch (error) {
      throw error;
    }
  }
}
