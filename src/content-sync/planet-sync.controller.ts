import { Controller, Post } from '@nestjs/common';
import { PlanetSyncService } from './planet-sync.service';

@Controller('planet-sync')
export class PlanetSyncController {
  constructor(private readonly planetSyncService: PlanetSyncService) {}

  @Post()
  sync() {
    return this.planetSyncService.sync();
  }

  @Post('sync-all')
  syncAll() {
    return this.planetSyncService.syncAll();
  }
}
