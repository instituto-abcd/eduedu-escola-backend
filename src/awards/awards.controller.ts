import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EduException } from '../common/exceptions/edu-school.exception';
import { AwardDto } from './dto/awards.dto';
import { AwardsService } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('awards')
@ApiTags('Conquistas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo prêmio' })
  @ApiCreatedResponse({
    description: 'Prêmio criado com sucesso',
    type: AwardDto,
  })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  async createAward(@Body() createAwardDto: CreateAwardDto): Promise<AwardDto> {
    try {
      return await this.awardsService.createAward(createAwardDto);
    } catch (error) {
      throw new EduException('UNKNOWN_ERROR');
    }
  }
}
