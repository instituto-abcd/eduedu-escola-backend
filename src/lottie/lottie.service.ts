import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/planet-sync/storage.service';

@Injectable()
export class LottieService {
  constructor(private readonly storageService: StorageService) {}

  async getLottieJson(lottieId: string) {
    const lottie = await this.storageService.getLottie(lottieId);
    return lottie;
  }
}
