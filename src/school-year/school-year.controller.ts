import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SchoolYearService } from './school-year.service';
import { ActivateSchoolYearRequestDto } from './dto/request/activate-school-year-request.dto';
import { SchoolId } from '../common/school-id.decorator';
import { SchoolYearSummary } from './dto/response/list-school-year-response.dto';
import {
  EduException,
  ErrorDetails,
} from '../common/exceptions/edu-school.exception';
import { DeleteSchoolYearResponseDto } from './dto/response/delete-school-year-response.dto';
import { AuditGuard } from '../common/guard/audit.guard';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@ApiTags('Ano Letivo')
@Controller('school-year')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SchoolYearController {
  constructor(private readonly schoolYearService: SchoolYearService) {}

  @Post()
  @AuditGuard()
  @ApiOperation({ summary: 'Criar um novo ano letivo' })
  @ApiCreatedResponse({ type: SchoolYearSummary })
  @ApiBadRequestResponse({
    status: ErrorDetails.CANNOT_CREATE_SCHOOL_YEAR.status,
    description: ErrorDetails.CANNOT_CREATE_SCHOOL_YEAR.message,
  })
  async createSchoolYear(
    @SchoolId() schoolId: string,
  ): Promise<SchoolYearSummary> {
    try {
      return await this.schoolYearService.createNextAvailableSchoolYear(
        schoolId,
      );
    } catch (error) {
      throw new EduException('CANNOT_CREATE_SCHOOL_YEAR');
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Listar os anos letivos' })
  @ApiOkResponse({ type: SchoolYearSummary, isArray: true })
  async getAllSchoolYears(): Promise<SchoolYearSummary[]> {
    try {
      return await this.schoolYearService.findAllSchoolYears();
    } catch (error) {
      throw new EduException('UNKNOWN_ERROR');
    }
  }

  @Get('current')
  @ApiOperation({ summary: 'Ano letivo atual' })
  @ApiOkResponse({ type: SchoolYearSummary, isArray: true })
  @ApiResponse({
    status: ErrorDetails.SCHOOL_YEAR_ALREADY_ACTIVE.status,
    description: ErrorDetails.SCHOOL_YEAR_ALREADY_ACTIVE.message,
  })
  async current(): Promise<SchoolYearSummary> {
    try {
      return await this.schoolYearService.current();
    } catch (error) {
      throw new EduException('UNKNOWN_ERROR');
    }
  }

  @Put('activate')
  @ApiOperation({ summary: 'Ativar um ano letivo' })
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

  @AuditGuard()
  @Delete()
  @ApiOperation({ summary: 'Excluir um ano letivo' })
  @ApiOkResponse({ type: DeleteSchoolYearResponseDto })
  async deleteSchoolYear(): Promise<DeleteSchoolYearResponseDto> {
    return await this.schoolYearService.deleteSchoolYearAndClasses();
  }
}
