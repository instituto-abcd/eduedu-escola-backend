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
  ApiBadRequestResponse,
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
import { AuditGuard } from 'src/common/guard/audit.guard';
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

@ApiTags('Turma')
@Controller('schoolClass')
export class SchoolClassController {
  constructor(
    private readonly schoolClassService: SchoolClassService,
    private readonly schoolClassResultService: SchoolClassResultService,
  ) { }

  @ApiOkResponse({
    description: 'Obtém o desempenho da turma em provas agrupados por eixo',
    type: SchoolClassPlanetResultDetailDto,
  })
  @ApiParam({ name: 'id', description: 'ID da turma', example: 'uuid' })
  @Get(':id/exams-performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getExamsPerformance(
    @Param('id') id: string,
  ): Promise<SchoolClassDetailedSummaryDto[]> {
    return this.schoolClassResultService.getSchoolClassDetailedSummary(id);
  }

  @AuditGuard()
  @Post()
  @ApiOperation({ summary: 'Criar uma nova turma' })
  @ApiCreatedResponse({
    description: 'Turma criada com sucesso',
    type: SchoolClassResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(
    @Body() createSchoolClassDto: CreateSchoolClassDto,
    @SchoolId() schoolId: string,
  ): Promise<CreateSchoolClassResponseDto> {
    return await this.schoolClassService.create(createSchoolClassDto, schoolId);
  }

  @Get('all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Este endpoint está depreciado', deprecated: true })
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
  @ApiResponse({
    status: 200,
    description: 'Turma encontrada com sucesso',
    type: SchoolClassResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  @ApiOperation({ summary: 'Obter turma por ID' })
  async findOne(@Param('id') id: string): Promise<SchoolClassResponseDto> {
    return this.schoolClassService.findOne(id);
  }

  @Get('user/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Recupera os nomes das salas associadas ao usuário',
    type: SchoolClassResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  @ApiOperation({
    summary: 'Recupera os nomes das salas associadas ao usuário',
  })
  async findOneSchoolClassesByUser(
    @Param('userId') userId: string,
  ): Promise<{ names: string }> {
    return this.schoolClassService.findOneSchoolClassesByUser(userId);
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Turma atualizada com sucesso',
    type: SchoolClassResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  @ApiOperation({ summary: 'Atualizar turma por ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateSchoolClassRequestDto,
  ): Promise<CreateSchoolClassResponseDto> {
    return this.schoolClassService.updateSchoolClass(id, updateUserDto);
  }

  @Delete()
  @ApiResponse({
    status: 200,
    description: 'Turmas removidas com sucesso',
    type: DeleteSchoolClassResponseDto,
  })
  @ApiOperation({ summary: 'Excluir turmas' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(
    @Req() req,
    @Body() requestDto: DeleteSchoolClassRequestDto,
  ): Promise<DeleteSchoolClassResponseDto> {
    const { ids } = requestDto;
    const user = req.user;
    return this.schoolClassService.remove(ids, user);
  }

  @AuditGuard()
  @Post('/:id/students/spreadsheet')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Adicionar alunos por meio de uma planilha' })
  @ApiResponse({ status: 201, description: 'Alunos adicionados com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro na validação da planilha' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @ApiResponse({
    status: 200,
    description: 'Modelo de planilha baixado com sucesso',
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

  @ApiOperation({
    summary: 'Listar alunos pertencentes a uma turma',
  })
  @ApiOkResponse({
    type: PaginationResponse,
  })
  @Get(':id/students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @ApiResponse({
    status: 200,
    description: 'Alunos movimentados com sucesso',
  })
  @Post(':destinationId/students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addStudentsToClass(
    @Param('destinationId') destinationId: string,
    @Body() data: AddStudentsToClassDto,
  ) {
    return this.schoolClassService.moveStudentsToClass(destinationId, data);
  }

  @Patch(':id/students/:studentId/reserved')
  @ApiResponse({
    status: 200,
    description: 'Valor do campo reserved atualizado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Turma ou aluno não encontrado' })
  @ApiOperation({
    summary: 'Atualizar campo reserved de um aluno em uma turma',
    deprecated: true,
  })
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
  @ApiOperation({
    summary: 'Obter o total de turmas por série',
  })
  @ApiResponse({
    status: 200,
    description: 'Sucesso ao obter total de turmas por série',
  })
  async countSchoolGrade(): Promise<CountSchoolGradeResponseDto[]> {
    return await this.schoolClassService.countSchoolGrade();
  }

  @ApiOkResponse({
    description: 'Retorna o gráfico de planetas para uma turma específica',
    type: ChartStudentResponse,
  })
  @ApiParam({ name: 'id', description: 'ID da turma', example: 'uuid' })
  @Get(':id/planets-chart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getPlanetsChart(
    @Param('id') id: string,
  ): Promise<ChartStudentResponse> {
    return this.schoolClassResultService.getChartByPlanetsForSchoolClass(id);
  }

  @ApiOkResponse({
    description: 'Retorna o gráfico de provas para uma turma específica',
    type: ChartStudentResponse,
  })
  @ApiParam({ name: 'id', description: 'ID da turma', example: 'uuid' })
  @Get(':id/exams-chart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getChartByExamsForSchoolClass(
    @Param('id') id: string,
  ): Promise<ChartStudentResponse> {
    return this.schoolClassResultService.getChartByExamForSchoolClass(id);
  }

  @ApiOkResponse({
    description: 'Obtém o desempenho da turma em planetas agrupados por eixo',
    type: SchoolClassPlanetResultDetailDto,
  })
  @ApiParam({ name: 'id', description: 'ID da turma', example: 'uuid' })
  @Get(':id/planets-performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getPlanetsPerformance(
    @Param('id') id: string,
  ): Promise<SchoolClassPlanetResultDetailDto[]> {
    return this.schoolClassResultService.getSchoolClassPlanetResultDetail(id);
  }

  @ApiOkResponse({
    description: 'Obtém o desempenho de alunos por Provas',
    type: ExamPerformanceResponse,
  })
  @ApiParam({ name: 'id', description: 'ID da turma', example: 'uuid' })
  @Get(':id/exams-performance-students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @ApiOkResponse({
    description: 'Obtém o desempenho nos planetas (Turma)',
    type: SchoolClassPlanetResultDetailDto,
  })
  @ApiParam({ name: 'id', description: 'ID da turma', example: 'uuid' })
  @Get(':id/planets-performance-students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @ApiOkResponse({
    description:
      'Obtém os alunos da turma que estão com nível IDEAL em todos os eixos',
    type: SchoolClassPlanetResultDetailDto,
  })
  @ApiParam({ name: 'id', description: 'ID da turma', example: 'uuid' })
  @Get(':id/ideal-students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllStudentsIdealAxis(
    @Param('id') id: string,
  ): Promise<IdealStudentsDto[]> {
    return await this.schoolClassResultService.findIdealStudentsByClassId(id);
  }
}
