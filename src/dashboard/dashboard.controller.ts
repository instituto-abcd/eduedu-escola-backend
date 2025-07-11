import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
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
  @ApiOperation({
    summary: 'Informações sobre todas as turmas do ano escolar requisitado',
  })
  @ApiOkResponse({ type: DashboardDto })
  @ApiOperation({ summary: 'Obter dashboard por ano escolar' })
  async getDashboard(
    @Req() req,
    @Param('schoolYear') schoolYear: number,
  ): Promise<DashboardDto> {
    const user = req.user;
    return this.dashboardService.getDashboard(schoolYear, user);
  }
}
