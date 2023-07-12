import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ErrorDetails } from '../common/exceptions/edu-school.exception';
import { StudentResponseDto } from './dto/response/student-response.dto';
import { DeleteStudentResponseDto } from './dto/response/delete-student-response.dto';
import { InativeStudantRequestDto } from './dto/request/inative-studant-request.dto';
import { InativeStudentResponseDto } from './dto/response/inative-student-response.dto';
import { PaginationResponse } from '../common/pagination/pagination-response.dto';

@Controller('student')
@ApiTags('Estudante')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

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
}
