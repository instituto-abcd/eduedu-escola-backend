import { Controller, Get } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetDto } from './dto/planet.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('planet')
@ApiTags('Planetas')
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
