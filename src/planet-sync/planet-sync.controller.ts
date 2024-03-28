import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SyncPlanetResponse } from './dto/sync-success.dto';
import { PlanetSyncService } from './planet-sync.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

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
    return this.planetSyncService.handleSyncAll();

    // if (process.env.ASSETS != 'LOCAL') {
    //   return this.planetSyncService.handleSyncAll();
    // } else {
    //   return this.planetSyncService.enqueueSyncAll();
    // }
  }

  @Post('force-sync-all')
  @ApiOperation({
    summary: 'Força Sincronizar planetas do Firestore',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da operação',
    type: SyncPlanetResponse,
  })
  forceSyncAll() {
    return this.planetSyncService.handleSyncAll();
  }

  @Get('sync-status')
  @ApiOperation({
    summary: 'Retorna o status da sincronização atual de planetas',
  })
  @ApiResponse({
    status: 200,
  })
  getPlanetSyncStatus() {
    return this.planetSyncService.getPlanetSyncStatus();
  }
}
