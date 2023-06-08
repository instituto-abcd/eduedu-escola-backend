import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SchoolYearService } from './school-year.service';
import { ActivateSchoolYearRequestDto } from './dto/request/activate-school-year-request.dto';
import { SchoolId } from '../common/school-id.decorator';
import { SchoolYearSummary } from './dto/response/list-school-year-response.dto';
import { EduException, ErrorDetails } from '../common/exceptions/edu-school.exception';
import { DeleteSchoolYearResponseDto } from './dto/response/delete-school-year-response.dto';

@ApiTags('Ano Letivo')
@Controller('school-year')
export class SchoolYearController {
  constructor(private readonly schoolYearService: SchoolYearService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo ano letivo' })
  @ApiCreatedResponse({ description: 'Ano Letivo criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  @ApiResponse({
    status: ErrorDetails.CANNOT_CREATE_SCHOOL_YEAR.status,
    description: ErrorDetails.CANNOT_CREATE_SCHOOL_YEAR.message,
  })
  async createSchoolYear(@SchoolId() schoolId: string): Promise<void> {
    try {
      await this.schoolYearService.createNextAvailableSchoolYear(schoolId);
    } catch (error) {
      throw new EduException('CANNOT_CREATE_SCHOOL_YEAR');
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Obter todos os anos letivos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos os anos letivos',
    type: [SchoolYearSummary],
  })
  @ApiResponse({
    status: ErrorDetails.SCHOOL_YEAR_ALREADY_ACTIVE.status,
    description: ErrorDetails.SCHOOL_YEAR_ALREADY_ACTIVE.message,
  })
  async getAllSchoolYears(): Promise<SchoolYearSummary[]> {
    try {
      return await this.schoolYearService.findAllSchoolYears();
    } catch (error) {
      throw new EduException('UNKNOWN_ERROR');
    }
  }

  @Put('activate')
  @ApiOperation({ summary: 'Ativar um ano letivo' })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  @ApiResponse({ status: 200, description: 'Ano letivo ativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Ano letivo não encontrado' })
  async activateSchoolYear(
    @Body() activateSchoolYearDto: ActivateSchoolYearRequestDto,
  ): Promise<void> {
    const { id } = activateSchoolYearDto;
    try {
      await this.schoolYearService.activateSchoolYear(id);
    } catch (error) {
      throw new EduException('SCHOOL_YEAR_ALREADY_ACTIVE');
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Excluir um ano letivo' })
  @ApiResponse({ status: 200, description: 'Ano letivo excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Ano letivo não encontrado' })
  async deleteSchoolYear(): Promise<DeleteSchoolYearResponseDto> {
    return await this.schoolYearService.deleteSchoolYearAndClasses();
  }
}
