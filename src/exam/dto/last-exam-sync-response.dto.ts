import { ApiProperty } from '@nestjs/swagger';

export class LastExamSyncResponseDto {
  @ApiProperty({ description: 'Data da ultima sincronizacao de provas' })
  syncedAt: Date;

  @ApiProperty({
    description: 'Diferenca em dias desde a ultima sincronizacao',
  })
  daysSinceLastSync: number;

  @ApiProperty({ description: 'Mostrar lembrete' })
  showReminder: boolean;
}
