import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':schoolYear')
  @ApiOperation({ summary: 'Obter contadores de Turmas' })
  @ApiResponse({
    status: 200,
    description: 'Painel de controle obtido com sucesso',
    type: DashboardDto,
  })
  @ApiOperation({ summary: 'Obter dashboard por ano escolar' })
  async getDashboard(
    @Param('schoolYear') schoolYear: number,
  ): Promise<DashboardDto> {
    return this.dashboardService.getDashboard(schoolYear);
  }
}
