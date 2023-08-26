import { ApiProperty } from '@nestjs/swagger';

export class ChartDatasetDto {
  @ApiProperty({
    type: String,
    example: 'Consciência Fonológica',
  })
  label: string;

  @ApiProperty({ type: [Number], isArray: true })
  data: number[];

  @ApiProperty({
    type: Number,
    example: 2,
  })
  borderWidth: number;
}
