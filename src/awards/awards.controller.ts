import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EduException } from '../common/exceptions/edu-school.exception';
import { AuditGuard } from 'src/common/guard/audit.guard';
import { AwardDto } from './dto/awards.dto';
import { AwardsService } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';

@Controller('awards')
@ApiTags('Conquistas')
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
