import { ApiProperty } from '@nestjs/swagger';

export class SyncExamResponse {
  @ApiProperty({ description: 'Status da operação' })
  success: boolean;

  @ApiProperty({ description: 'Quantidade de provas sincronizadas' })
  examsSynced: number;

  @ApiProperty({ description: 'Quantidade de provas atualizadas' })
  examsUpdated: number;
}
