import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetDto } from './dto/planet.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Question } from 'src/planet-sync/schemas/planet.schema';

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

  @Get('question-models')
  @ApiResponse({
    status: 201,
    description: 'Retorna todos os modelos das questões de todos os planetas',
    type: PlanetDto,
  })
  findPlanetModels(): Promise<any> {
    return this.planetService.findPlanetModels();
  }

  @Get(':id/questions')
  @ApiResponse({
    status: 201,
    description: 'Retorna as questões de planetas',
    type: PlanetDto,
  })
  findPlanetQuestions(@Param('id') planetId: string): Promise<Question[]> {
    return this.planetService.findPlanetQuestions(planetId);
  }

  @Get(':id/questions/:questionId')
  @ApiResponse({
    status: 201,
    description: 'Retorna as questões de planetas',
    type: PlanetDto,
  })
  findPlanetQuestion(
    @Param('id') planetId: string,
    @Param('questionId') questionId: string,
  ): Promise<Question> {
    return this.planetService.findPlanetQuestion(planetId, questionId);
  }

  @Get('/all-questions?')
  @ApiResponse({
    status: 201,
    description: 'Retorna as questões de planetas',
    type: PlanetDto,
  })
  findAllPlanetQuestion(
    @Query('modelId') modelId: string
  ): Promise<Question[]> {
    return this.planetService.findAllPlanetQuestions(modelId);
  }
}
