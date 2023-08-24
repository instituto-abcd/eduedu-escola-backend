import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { PlanetChartStudentResponse } from '../student/dto/response/planet-chart-studant-response.dto';
import { StudentResultService } from '../student/studentResult.service';
import { SchoolClassResultService } from "./school-class-result.service";

@ApiTags('Turma')
@Controller('schoolClass')
export class SchoolClassController {
  constructor(
    private readonly schoolClassService: SchoolClassService,
    private readonly schoolClassResultService: SchoolClassResultService,
  ) {}

  @AuditGuard()
  @Post()
  @ApiOperation({ summary: 'Criar uma nova turma' })
  @ApiCreatedResponse({
    description: 'Turma criada com sucesso',
    type: SchoolClassResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  async create(
    @Body() createSchoolClassDto: CreateSchoolClassDto,
    @SchoolId() schoolId: string,
  ): Promise<CreateSchoolClassResponseDto> {
    return await this.schoolClassService.create(createSchoolClassDto, schoolId);
  }

  @Get('all')
  async findAll(
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

    return this.schoolClassService.findAll(pageNumber, pageSize, filters);
  }

  @Get(':id')
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

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Turma atualizada com sucesso',
    type: SchoolClassResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  @ApiOperation({ summary: 'Atualizar turma por ID' })
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
  async remove(
    @Body() requestDto: DeleteSchoolClassRequestDto,
  ): Promise<DeleteSchoolClassResponseDto> {
    const { ids } = requestDto;
    return this.schoolClassService.remove(ids);
  }

  @AuditGuard()
  @Post('/:id/students/spreadsheet')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Adicionar alunos por meio de uma planilha' })
  @ApiResponse({ status: 201, description: 'Alunos adicionados com sucesso' })
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
  studentsByClass(
    @Param('id') id: string,
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
  ): Promise<PaginationResponse<StudentSimplifiedResponseDto>> {
    const pageNumber = parseInt(page || '1');
    const pageSize = parseInt(limit || '10');
    return this.schoolClassService.getStudentsByClass(id, pageNumber, pageSize);
  }

  @ApiResponse({
    status: 200,
    description: 'Alunos movimentados com sucesso',
  })
  @Post(':destinationId/students')
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

  @ApiOkResponse({
    description: 'Retorna o gráfico de planetas para uma turma específica',
    type: PlanetChartStudentResponse,
  })
  @ApiParam({ name: 'id', description: 'ID da turma', example: 'id-da-turma' })
  @Get(':id/planets-chart')
  async getPlanetsChart(
    @Param('id') id: string,
  ): Promise<PlanetChartStudentResponse> {
    return this.schoolClassResultService.calculatePlanetsChartForClass(id);
  }
}
