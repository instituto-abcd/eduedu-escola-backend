import { Controller, Post } from '@nestjs/common';
import { SyncPlanetResponse } from './dto/sync-success.dto';
import { PlanetSyncService } from './planet-sync.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Sincronizar Planetas')
@Controller('planet-sync')
export class PlanetSyncController {
  constructor(private readonly planetSyncService: PlanetSyncService) {}

  @Post()
  @ApiOperation({ summary: 'Sincronizar planetas da fila' })
  @ApiResponse({
    status: 200,
    description: 'Status da operação',
    type: SyncPlanetResponse,
  })
  sync() {
    return this.planetSyncService.sync();
  }

  @Post('sync-all')
  @ApiOperation({
    summary: 'Sincronizar planetas do Firestore (ignora a fila)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da operação',
    type: SyncPlanetResponse,
  })
  syncAll() {
    return this.planetSyncService.syncAll();
  }
}
