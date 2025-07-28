import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SchoolClassService } from './school-class.service';
import { CreateSchoolClassResponseDto } from './dto/response/create-school-class-response';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { SchoolId } from '../common/school-id.decorator';
import { DeleteSchoolClassRequestDto } from './dto/request/delete-school-class-request.dto';
import { DeleteSchoolClassResponseDto } from './dto/response/delete-school-class-response.dto';
import { SchoolClassResponseDto } from './dto/response/school-class-response';
import { UpdateSchoolClassRequestDto } from './dto/request/update-school-class-request';
import { PaginationResponse } from '../common/pagination/pagination-response.dto';
import { CreateStudentRequestDto } from '../student/dto/request/create-student-request.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { EduException } from '../common/exceptions/edu-school.exception';
import { Response } from 'express';
import { join } from 'path';
import { AddStudentsToClassDto } from './dto/add-students-to-class.dto';
import { AuditGuard } from '../common/guard/audit.guard';
import { ReservedStudentRequestDto } from './dto/request/reserved-student-request.dto';
import { UpdateStudentReservedResponseDto } from './dto/response/update-student-reserved-response';
import { StudentSimplifiedResponseDto } from '../student/dto/response/student-simplified-response.dto';
import { ChartStudentResponse } from '../student/dto/response/chart-studant-response.dto';
import { SchoolClassResultService } from './school-class-result.service';
import { SchoolClassPlanetResultDetailDto } from './dto/response/school-class-planet-result-detail.dto';
import { SchoolClassDetailedSummaryDto } from './dto/response/school-class-detailed-summary.dto';
import { ExamPerformanceResponse } from './dto/response/exam-performance.response';
import { PlanetsPerformanceResponse } from './dto/response/planets-performance.dto';
import { IdealStudentsDto } from './dto/response/ideal-students.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { QueryFilter } from './dto/request/query.enum';
import { CountSchoolGradeResponseDto } from './dto/response/count-school-grade-response';
import { ApiPaginatedResponse } from 'src/common/pagination/pagination-decorator';

@ApiTags('Turma')
@Controller('schoolClass')
export class SchoolClassController {
  constructor(
    private readonly schoolClassService: SchoolClassService,
    private readonly schoolClassResultService: SchoolClassResultService,
  ) {}

  @Get(':id/exams-performance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    description: 'Desempenho da turma em provas por eixo',
    type: SchoolClassPlanetResultDetailDto,
  })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  async getExamsPerformance(
    @Param('id') id: string,
  ): Promise<SchoolClassDetailedSummaryDto[]> {
    return this.schoolClassResultService.getSchoolClassDetailedSummary(id);
  }

  @Post()
  @AuditGuard()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova turma' })
  @ApiCreatedResponse({ type: SchoolClassResponseDto })
  async create(
    @Body() createSchoolClassDto: CreateSchoolClassDto,
    @SchoolId() schoolId: string,
  ): Promise<CreateSchoolClassResponseDto> {
    return await this.schoolClassService.create(createSchoolClassDto, schoolId);
  }

  @Get('all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar turmas (autenticado)', deprecated: true })
  @ApiOkResponse({ type: SchoolClassResponseDto, isArray: true })
  async findAll(
    @Req() req,
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('name') name?: string,
    @Query('schoolGrade') schoolGrade?: string,
    @Query('schoolPeriod') schoolPeriod?: string,
    @Query('schoolYearName') schoolYearName?: number,
    @Query('teacherName') teacherName?: string,
  ): Promise<PaginationResponse<SchoolClassResponseDto>> {
    const pageNumber = parseInt(page || '1');
    const pageSize = parseInt(limit || '10');
    const user = req.user;

    const filters = {
      name,
      schoolGrade,
      schoolPeriod,
      schoolYearName,
      teacherName,
    };

    return this.schoolClassService.findAll(pageNumber, pageSize, filters, user);
  }

  @Get('all-no-auth')
  @ApiOperation({ summary: 'Listar turmas' })
  @ApiOkResponse({ type: SchoolClassResponseDto, isArray: true })
  async findAllNoAuth(
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('name') name?: string,
    @Query('schoolGrade') schoolGrade?: string,
    @Query('schoolPeriod') schoolPeriod?: string,
    @Query('schoolYearName') schoolYearName?: number,
    @Query('teacherName') teacherName?: string,
  ): Promise<PaginationResponse<SchoolClassResponseDto>> {
    const pageNumber = parseInt(page || '1');
    const pageSize = parseInt(limit || '10');

    const filters = {
      name,
      schoolGrade,
      schoolPeriod,
      schoolYearName,
      teacherName,
    };

    return this.schoolClassService.findAllNoAuth(pageNumber, pageSize, filters);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buscar turma por ID' })
  @ApiOkResponse({ type: SchoolClassResponseDto })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  async findOne(@Param('id') id: string): Promise<SchoolClassResponseDto> {
    return this.schoolClassService.findOne(id);
  }

  @Get('user/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lista nome das turmas de um usuário (Professor)',
    description:
      'Lista em uma única string, separado por vírgulas, junto do ano letivo escolar. Exemplo: `"1 ano - 2023, 2 ano - 2023, 3 ano - 2023, Infantil - 2023, Sincroniza - 2025"`',
  })
  @ApiResponse({ type: String })
  async findOneSchoolClassesByUser(
    @Param('userId') userId: string,
  ): Promise<{ names: string }> {
    return this.schoolClassService.findOneSchoolClassesByUser(userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar turma' })
  @ApiOkResponse({ type: SchoolClassResponseDto })
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() schoolClassPayload: UpdateSchoolClassRequestDto,
  ): Promise<CreateSchoolClassResponseDto> {
    const user = req.user;
    return this.schoolClassService.updateSchoolClass(
      id,
      schoolClassPayload,
      user.profile,
    );
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir turmas' })
  @ApiOkResponse({ type: DeleteSchoolClassResponseDto })
  async remove(
    @Req() req,
    @Body() requestDto: DeleteSchoolClassRequestDto,
  ): Promise<DeleteSchoolClassResponseDto> {
    const { ids } = requestDto;
    const user = req.user;
    return this.schoolClassService.remove(ids, user);
  }

  @Post('/:id/students/spreadsheet')
  @UseInterceptors(FileInterceptor('file'))
  @AuditGuard()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atribuir alunos á turma por planilha' })
  @ApiOkResponse({ status: 201, description: 'Alunos adicionados com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro na validação da planilha' })
  async addStudentsFromSpreadsheet(
    @Param('id') schoolClassId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ items: CreateStudentRequestDto[] }> {
    const studentsData: CreateStudentRequestDto[] =
      await this.schoolClassService.parseSpreadsheet(file);

    const validationErrors: string[] =
      this.schoolClassService.validateSpreadsheetData(studentsData);

    if (validationErrors.length > 0) {
      throw new EduException('INVALID_FIELDS_WORKSHEET');
    }

    const createdStudents = await this.schoolClassService.addStudentsToClass(
      schoolClassId,
      studentsData,
    );

    return { items: createdStudents };
  }

  @Get('/students/spreadsheet-template')
  @ApiOperation({
    summary: 'Download do modelo de planilha para upload de alunos',
  })
  downloadSpreadsheetTemplate(@Res() res: Response): void {
    try {
      const templateFilePath = join(
        __dirname,
        '..',
        '..',
        'templates',
        'eduedu-escola-aluno-template.xlsx',
      );
      res.download(templateFilePath, 'eduedu-escola-aluno-template.xlsx');
    } catch (e) {
      throw new EduException('UNKNOWN_ERROR');
    }
  }

  @Get(':id/students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar alunos da turma' })
  @ApiPaginatedResponse(StudentSimplifiedResponseDto)
  studentsByClass(
    @Param('id') id: string,
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('name') name?: string,
  ): Promise<PaginationResponse<StudentSimplifiedResponseDto>> {
    const pageNumber = parseInt(page || '1');
    const pageSize = parseInt(limit || '10');
    return this.schoolClassService.getStudentsByClass(
      id,
      pageNumber,
      pageSize,
      name,
    );
  }

  @Post(':destinationId/students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trocar alunos de turma' })
  addStudentsToClass(
    @Param('destinationId') destinationId: string,
    @Body() data: AddStudentsToClassDto,
  ) {
    return this.schoolClassService.moveStudentsToClass(destinationId, data);
  }

  @Patch(':id/students/:studentId/reserved')
  @ApiOperation({
    summary: 'Atualizar campo reserved de um aluno em uma turma',
    deprecated: true,
  })
  @ApiNotFoundResponse({ description: 'Turma ou aluno não encontrado' })
  async updateStudentReserved(
    @Param('id') schoolClassId: string,
    @Param('studentId') studentId: string,
    @Body() reserved: ReservedStudentRequestDto,
  ): Promise<UpdateStudentReservedResponseDto> {
    return await this.schoolClassService.updateStudentReserved(
      schoolClassId,
      studentId,
      reserved,
    );
  }

  @Get('/count/school-grade')
  @ApiOperation({ summary: 'Contagem do total de turmas por série' })
  @ApiOkResponse({ type: CountSchoolGradeResponseDto, isArray: true })
  async countSchoolGrade(): Promise<CountSchoolGradeResponseDto[]> {
    return await this.schoolClassService.countSchoolGrade();
  }

  @Get(':id/planets-chart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gráfico de planetas para a turma' })
  @ApiOkResponse({ type: ChartStudentResponse })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  async getPlanetsChart(
    @Param('id') id: string,
  ): Promise<ChartStudentResponse> {
    return this.schoolClassResultService.getChartByPlanetsForSchoolClass(id);
  }

  @Get(':id/exams-chart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gráfico de provas para a turma' })
  @ApiOkResponse({ type: ChartStudentResponse })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  async getChartByExamsForSchoolClass(
    @Param('id') id: string,
  ): Promise<ChartStudentResponse> {
    return this.schoolClassResultService.getChartByExamForSchoolClass(id);
  }

  @Get(':id/planets-performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Desempenho da turma em planetas agrupados por eixo',
  })
  @ApiOkResponse({ type: SchoolClassPlanetResultDetailDto })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  async getPlanetsPerformance(
    @Param('id') id: string,
  ): Promise<SchoolClassPlanetResultDetailDto[]> {
    return this.schoolClassResultService.getSchoolClassPlanetResultDetail(id);
  }

  @Get(':id/exams-performance-students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desempenho de alunos por Provas' })
  @ApiOkResponse({ type: ExamPerformanceResponse })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  async examsPerformanceStudents(
    @Param('id') id: string,
    @Query('studentName') studentName?: string,
    @Query('examDate') examDate?: string, // Date format: DD/MM
    @Query('cfo') cfo?: QueryFilter,
    @Query('lct') lct?: QueryFilter,
    @Query('sea') sea?: QueryFilter,
  ): Promise<ExamPerformanceResponse[]> {
    return await this.schoolClassResultService.examsPerformanceStudents(
      id,
      studentName,
      examDate,
      cfo,
      lct,
      sea,
    );
  }

  @Get(':id/planets-performance-students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desempenho da turma nos planetas' })
  @ApiOkResponse({ type: SchoolClassPlanetResultDetailDto })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  async schoolClassPerformancePlanets(
    @Param('id') id: string,
    @Query('studentName') studentName?: string,
    @Query('examDate') examDate?: string, // Date format: DD/MM
    @Query('cfo') cfo?: QueryFilter,
    @Query('lct') lct?: QueryFilter,
    @Query('sea') sea?: QueryFilter,
  ): Promise<PlanetsPerformanceResponse[]> {
    return await this.schoolClassResultService.schoolClassPerformancePlanets(
      id,
      studentName,
      examDate,
      cfo,
      lct,
      sea,
    );
  }

  @Get(':id/ideal-students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Alunos da turma que estão com nível IDEAL em todos os eixos',
  })
  @ApiOkResponse({ type: SchoolClassPlanetResultDetailDto })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  async getAllStudentsIdealAxis(
    @Param('id') id: string,
  ): Promise<IdealStudentsDto[]> {
    return await this.schoolClassResultService.findIdealStudentsByClassId(id);
  }
}
