import { ApiProperty } from '@nestjs/swagger';
import { Summary } from './summary.dto';

export class SchoolYearSummary {
  @ApiProperty({ description: 'O id do ano letivo.' })
  id: number;

  @ApiProperty({ description: 'O nome do ano letivo.' })
  name: string;

  @ApiProperty({ description: 'O status do ano letivo.' })
  status: string;

  @ApiProperty({ description: 'A data de criação do ano letivo.' })
  createdAt: Date;

  @ApiProperty({ description: 'A data da última atualização do ano letivo.' })
  updatedAt: Date;

  @ApiProperty({
    description: 'O resumo do ano letivo.',
    type: () => Summary,
  })
  summary: Summary;
}
