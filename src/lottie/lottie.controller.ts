import { Controller, Get, Param } from '@nestjs/common';
import { LottieService } from './lottie.service';

@Controller('lottie')
export class LottieController {
  constructor(private readonly lottieService: LottieService) {}

  @Get(':lottieId')
  findAll(@Param('lottieId') lottieId: string) {
    return this.lottieService.getLottieJson(lottieId);
  }
}
