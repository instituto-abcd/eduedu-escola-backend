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
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
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

  @Get('test-stream')
  @ApiOperation({
    summary: 'Teste Stream',
  })
  @ApiResponse({
    status: 200,
  })
  testStream() {
    return this.planetSyncService.testStream();
  }
}
