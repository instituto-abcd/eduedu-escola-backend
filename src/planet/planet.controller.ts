import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetDto } from './dto/planet.dto';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlanetDocument, Question } from '../planet-sync/schemas/planet.schema';
import { QuestionDto } from 'src/exam/dto/question.dto';

@Controller('planet')
@ApiTags('Planetas')
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

  @Delete('/reset-cache-all-models')
  @ApiOperation({
    summary: '[DEBUG] Apaga o cache de modelos',
    description:
      'Deve ser usado quando em desenvolvimento a listagem de questões por modelo (ex. url: /debug/model?modelid=MODEL2) não está incluindo a questão de algum planeta. Isso pode acontecer quando foram criados ou alterados planetas no EduLab depois de essa requisição ter sido cacheada.',
  })
  @ApiOkResponse({ description: 'Cache de modelos excluído' })
  resetAllPlanetQuestionsCache(): Promise<{ message: string }> {
    return this.planetService.resetAllPlanetQuestionsCache();
  }

  @Get('/all-models')
  @ApiOperation({
    summary: '[DEBUG] [NÃO UTILIZADO] Listar modelos de um planeta',
  })
  @ApiResponse({ type: [String] })
  findAllPlanetModels(
    @Query('planetId') planetIds: string[],
  ): Promise<string[]> {
    return this.planetService.findAllPlanetModels(planetIds);
  }

  @Get('/all-questions')
  @ApiOperation({
    summary: '[DEBUG] Todas as quesões de um determinado modelo',
  })
  @ApiOkResponse({
    description: 'Retorna as questões de planetas',
    type: QuestionDto,
    isArray: true,
  })
  findAllPlanetQuestion(@Query('modelId') modelId: string): Promise<any> {
    return this.planetService.findAllPlanetQuestions(modelId);
  }

  @Get('/question-models')
  @ApiOperation({
    summary: '[DEBUG] Lista todos os modelos únicos com ao menos 1 questão',
  })
  @ApiOkResponse({ type: [String] })
  findPlanetModels(): Promise<string[]> {
    return this.planetService.findPlanetModels();
  }

  @Get('/test-questions')
  @ApiOperation({
    summary: '[DEBUG] [NÃO UTILIZADO] ???',
  })
  @ApiOkResponse({ type: [QuestionDto] })
  findAllPlanetQuestionTest(@Query('modelId') modelId: string): Promise<any[]> {
    return this.planetService.findAllPlanetQuestionsTest(modelId);
  }

  @Get('/axis-code/:axisCode/level/:level')
  @ApiOperation({ summary: 'Lista planetas com base em eixo e nível' })
  @ApiOkResponse({ type: PlanetDto, isArray: true })
  findAllPlanetsByAxisAndLevel(
    @Param('axisCode') axisCode: string,
    @Param('level') level: number,
  ): Promise<PlanetDto[]> {
    return this.planetService.findAllPlanetsByAxisAndLevel(axisCode, level);
  }

  @Get('/assign-all-planets/:id')
  @ApiOperation({
    summary: '[DEBUG] Atribuir todos os planetas a um aluno',
    description:
      'Usado para testes internos, essa chamada vai ignorar os filtros de Eixo e Nível para o aluno logado e irá atribuir todos os planetas disponíveis em sua trilha.',
  })
  assignAllPlanetsToUser(
    @Param('id') studentId: string,
  ): Promise<{ success: boolean }> {
    return this.planetService.assignAllPlanetsToUser(studentId);
  }

  @Get(':id/questions/:questionId')
  @ApiOperation({ summary: 'Retorna uma questão de um planeta' })
  @ApiOkResponse({ type: QuestionDto })
  findPlanetQuestion(
    @Param('id') planetId: string,
    @Param('questionId') questionId: string,
  ): Promise<Question> {
    return this.planetService.findPlanetQuestion(planetId, questionId);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: '[DEBUG] Lista todas questões de um planeta' })
  @ApiOkResponse({ type: QuestionDto, isArray: true })
  findPlanetQuestions(@Param('id') planetId: string): Promise<Question[]> {
    return this.planetService.findPlanetQuestions(planetId);
  }

  @Get('/name/:name')
  @ApiOperation({ summary: 'Buscar planeta por nome' })
  @ApiOkResponse({ type: PlanetDto })
  getByNamePartial(@Param('name') name: string): Promise<PlanetDocument[]> {
    return this.planetService.getByNamePartial(name);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Buscar planeta por ID' })
  @ApiOkResponse({ type: PlanetDto })
  getPlanet(@Param('id') id: string): Promise<PlanetDocument> {
    return this.planetService.getOne(id);
  }

  @Get('/')
  @ApiOperation({
    summary: '[!] [DEBUG] Listar todos os planetas',
    description:
      'Essa requisição é extremamente pesada e deve ser usada com cautela, de preferência, nunca em ambientes produtivos',
  })
  @ApiOkResponse({ type: PlanetDto, isArray: true })
  findAll(): Promise<PlanetDto[]> {
    return this.planetService.findAll();
  }
}
