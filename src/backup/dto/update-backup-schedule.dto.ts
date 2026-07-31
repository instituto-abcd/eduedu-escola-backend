import { ApiProperty } from '@nestjs/swagger';

export class UpdateBackupScheduleDto {
  @ApiProperty({ example: true, required: false })
  enabled?: boolean;

  @ApiProperty({
    example: 0,
    required: false,
    description: 'Dia da semana do backup: 0 = domingo ... 6 = sábado',
  })
  dayOfWeek?: number;

  @ApiProperty({ example: 2, required: false, description: 'Hora (0 a 23)' })
  hour?: number;

  @ApiProperty({ example: 0, required: false, description: 'Minuto (0 a 59)' })
  minute?: number;

  @ApiProperty({
    example: 4,
    required: false,
    description: 'Quantos arquivos de backup manter antes de apagar os antigos',
  })
  retentionCount?: number;
}
