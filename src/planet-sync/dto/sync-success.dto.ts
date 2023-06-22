import { ApiProperty } from '@nestjs/swagger';

export class SyncPlanetResponse {
  @ApiProperty({ description: 'Status da operação' })
  success: boolean;

  @ApiProperty({ description: 'Quantidade de planetas sincronizados' })
  planetsSynced: number;

  @ApiProperty({ description: 'Quantidade de planetas atualizados' })
  planetsUpdated: number;
}
