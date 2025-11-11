import {
  Controller,
  Get,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { SyncPlanetResponse } from './dto/sync-success.dto';
import { PlanetSyncService } from './planet-sync.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LastSyncResponseDto } from './dto/last-sync-response.dto';

@ApiTags('Sincronizar Planetas')
@Controller('planet-sync')
export class PlanetSyncController {
  constructor(private readonly planetSyncService: PlanetSyncService) {}

  @Post()
  @ApiOperation({
    summary: 'Sincronizar planetas da fila',
    description:
      'Sincronizará planetas apenas com a propriedade `synced: false`. Após cada sincronização, um planeta é marcado com `synced: true`, para evitar de baixar o mesmo planeta múltiplas vezes.',
  })
  @ApiOkResponse({ type: SyncPlanetResponse })
  sync() {
    return this.planetSyncService.sync();
  }

  @Post('sync-all')
  @ApiOperation({
    summary: 'Sincronizar planetas do Firestore (ignora a fila)',
    description:
      'Sincroniza todos os planetas mesmo que este já esteja sincronizado, ignorando a flag `synced: true`.',
  })
  @ApiOkResponse({ type: SyncPlanetResponse })
  async syncAll() {
    try {
      await this.planetSyncService.enqueueSyncAll();
      return {
        message: 'Sincronização de todos os planetas enfileirada.',
        status: 202,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Falha ao enfileirar sincronização: ' + error.message,
      );
    }
  }

  @Post('force-sync-all')
  @ApiOperation({
    summary: 'Sincronizar tudo ignorando cache e flag `synced: true`',
  })
  @ApiOkResponse({ type: SyncPlanetResponse })
  forceSyncAll() {
    return this.planetSyncService.handleSyncAll();
  }

  // TODO: add types
  @Get('sync-status')
  @ApiOperation({
    summary: 'Status da operação de sincronização',
  })
  getPlanetSyncStatus() {
    return this.planetSyncService.getPlanetSyncStatus();
  }

  @Get('last-sync')
  @ApiOperation({ summary: 'Última data de sincronização' })
  @ApiOkResponse({ type: LastSyncResponseDto })
  getLastSync(): Promise<LastSyncResponseDto> {
    return this.planetSyncService.getLastSync();
  }
}
