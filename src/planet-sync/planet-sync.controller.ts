import {
  Controller,
  Get,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { SyncPlanetResponse } from './dto/sync-success.dto';
import { PlanetSyncService } from './planet-sync.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LastPlanetSyncResponseDto } from './dto/last-planet-sync-response.dto';

@ApiTags('Sincronizar Planetas')
@Controller('planet-sync')
export class PlanetSyncController {
  constructor(private readonly planetSyncService: PlanetSyncService) {}

  @Post()
  @ApiOperation({
    summary: 'Sincronizar planetas da fila',
    description:
      'Sincronizara planetas apenas com a propriedade `synced: false`. Apos cada sincronizacao, um planeta e marcado com `synced: true`, para evitar de baixar o mesmo planeta multiplas vezes.',
  })
  @ApiOkResponse({ type: SyncPlanetResponse })
  sync() {
    return this.planetSyncService.sync();
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Sincronizar planetas (assets e dados) - Enfileira em background',
    description:
      'Enfileira a sincronizacao de planetas para execucao em background. Baixa os assets de planeta do endpoint /asset/planet, extrai para assets-data/, e sincroniza dados dos planetas do Firestore para o MongoDB local.',
  })
  @ApiOkResponse({ type: SyncPlanetResponse })
  async syncAll() {
    try {
      await this.planetSyncService.enqueueSyncAll();
      return {
        message: 'Sincronizacao de planetas enfileirada.',
        status: 202,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Falha ao enfileirar sincronizacao de planetas: ' + error.message,
      );
    }
  }

  @Post('force-sync')
  @ApiOperation({
    summary: 'Sincronizar planetas de forma sincrona (ignora fila)',
    description:
      'Executa a sincronizacao de planetas de forma sincrona, sem usar a fila.',
  })
  @ApiOkResponse({ type: SyncPlanetResponse })
  forceSyncAll() {
    return this.planetSyncService.handleSyncAll();
  }

  @Get('sync-status')
  @ApiOperation({
    summary: 'Status da operacao de sincronizacao de planetas',
  })
  getPlanetSyncStatus() {
    return this.planetSyncService.getPlanetSyncStatus();
  }

  @Get('last-sync')
  @ApiOperation({ summary: 'Ultima data de sincronizacao de planetas' })
  @ApiOkResponse({ type: LastPlanetSyncResponseDto })
  getLastSync(): Promise<LastPlanetSyncResponseDto> {
    return this.planetSyncService.getLastSync();
  }
}
