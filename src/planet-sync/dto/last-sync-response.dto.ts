import { ApiProperty } from '@nestjs/swagger';

export class LastSyncResponseDto {
  @ApiProperty({ description: 'Data da última sincronização' })
  syncedAt: Date;

  @ApiProperty({ description: 'Diferença em dias desde a última sincronização' })
  daysSinceLastSync: number;

  @ApiProperty({ description: 'Mostrar lembrete' })
  showReminder: boolean;
}
