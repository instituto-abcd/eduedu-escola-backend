import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LottieService } from './lottie.service';

@Controller('lottie')
@ApiTags('Lottie')
export class LottieController {
  constructor(private readonly lottieService: LottieService) {}

  @Get(':lottieId')
  @ApiOperation({ summary: 'Retorna um JSON de lottie (em string)' })
  @ApiOkResponse({ type: String })
  findAll(@Param('lottieId') lottieId: string) {
    return this.lottieService.getLottieJson(lottieId);
  }
}
