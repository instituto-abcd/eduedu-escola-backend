import { ApiProperty } from '@nestjs/swagger';

export class BackupScheduleResponseDto {
  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({
    example: 0,
    description: 'Dia da semana do backup: 0 = domingo ... 6 = sábado',
  })
  dayOfWeek: number;

  @ApiProperty({ example: 2 })
  hour: number;

  @ApiProperty({ example: 0 })
  minute: number;

  @ApiProperty({ example: 4 })
  retentionCount: number;

  @ApiProperty({
    example: 'America/Sao_Paulo',
    description:
      'Fuso em que o dia e a hora são interpretados. Definido por ambiente, não editável pela escola.',
  })
  timeZone: string;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'Data do último backup automático concluído com sucesso',
  })
  lastRunAt: Date | null;

  @ApiProperty({ type: String, nullable: true })
  lastRunFile: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Erro da última tentativa. Fica preenchido até um backup concluir com sucesso, porque um backup automático que falha de madrugada não tem ninguém para ver o aviso na hora.',
  })
  lastError: string | null;

  @ApiProperty({
    type: Date,
    nullable: true,
    description:
      'Próxima janela prevista; nulo quando o backup está desativado',
  })
  nextRunAt: Date | null;

  @ApiProperty({
    example: false,
    description:
      'Indica que a janela desta semana passou sem backup (máquina desligada, por exemplo) e que ele será feito na próxima verificação, sem esperar a semana seguinte.',
  })
  overdue: boolean;

  @ApiProperty({
    example: false,
    description: 'Indica que um backup automático está em andamento agora',
  })
  running: boolean;
}
