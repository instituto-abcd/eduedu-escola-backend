import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obter contadores de Turmas' })
  @ApiResponse({
    status: 200,
    description: 'Painel de controle obtido com sucesso',
    type: DashboardDto,
  })
  async getDashboard(): Promise<DashboardDto[]> {
    return this.dashboardService.getDashboard();
  }
}
