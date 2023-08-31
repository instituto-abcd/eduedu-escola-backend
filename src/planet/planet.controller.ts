import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetDto } from './dto/planet.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('planet')
@ApiTags('Planetas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

  @Get()
  @ApiResponse({
    status: 201,
    description: 'Retorna todos os planetas',
    type: PlanetDto,
  })
  findAll(): Promise<PlanetDto[]> {
    return this.planetService.findAll();
  }
}
