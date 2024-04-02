import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetDto } from './dto/planet.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Question } from 'src/planet-sync/schemas/planet.schema';

@Controller('planet')
@ApiTags('Planetas')
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

  @Get('/assign-all-planets/:id')
  @ApiResponse({
    status: 201,
    description: 'Atribuir todos planetas ao usuário ',
  })
  assignAllPlanetsToUser(@Param('id') studentId: string): Promise<any[]> {
    return this.planetService.assignAllPlanetsToUser(studentId);
  }

  @Get(':axisCode/level/:level')
  @ApiResponse({
    status: 200,
    description: 'Retorna todos os planetas por eixo e nível',
    type: [PlanetDto],
  })
  findAllPlanetsByAxisAndLevel(
    @Param('axisCode') axisCode: string,
    @Param('level') level: number,
  ): Promise<PlanetDto[]> {
    return this.planetService.findAllPlanetsByAxisAndLevel(axisCode, level);
  }

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
  findAllPlanetQuestion(@Query('modelId') modelId: string): Promise<any[]> {
    return this.planetService.findAllPlanetQuestions(modelId);
  }

  @Get('/test-questions?')
  @ApiResponse({
    status: 201,
    description: 'Retorna as questões de planetas PARA TESTE',
    type: PlanetDto,
  })
  findAllPlanetQuestionTest(@Query('modelId') modelId: string): Promise<any[]> {
    return this.planetService.findAllPlanetQuestionsTest(modelId);
  }

  @Get('/all-models?')
  @ApiResponse({
    status: 201,
    description: 'Retorna os modelos de questão utilizados em planetas',
    type: PlanetDto,
  })
  findAllPlanetModels(@Query('planetId') planetIds: string[]): Promise<any[]> {
    return this.planetService.findAllPlanetModels(planetIds);
  }

  @Delete('/reset-cache-all-models')
  @ApiResponse({
    status: 200,
    description: 'Reset cache',
  })
  resetAllPlanetQuestionsCache(): Promise<any> {
    return this.planetService.resetAllPlanetQuestionsCache();
  }
}
