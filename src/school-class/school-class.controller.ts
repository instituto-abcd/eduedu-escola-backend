import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
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

@ApiTags('Turma')
@Controller('schoolClass')
export class SchoolClassController {
  constructor(private readonly schoolClassService: SchoolClassService) {}

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
  @ApiOperation({ summary: 'Obter todas as turmas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas as turmas',
    type: [SchoolClassResponseDto],
  })
  async getAllSchoolClasses(): Promise<SchoolClassResponseDto[]> {
    return await this.schoolClassService.findAllUserSchoolClasses();
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
  ): Promise<SchoolClassResponseDto> {
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
}
