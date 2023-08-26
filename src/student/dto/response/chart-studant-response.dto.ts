import { ApiProperty } from '@nestjs/swagger';
import { PlanetAxis } from './planet-chart.-axis-dto';
import { ChartDatasetDto } from './chart-dataset-dto';

export class ChartStudentResponse {
  @ApiProperty({
    type: [String],
    example: ['10/01', '15/01', '20/03', '25/04'],
  })
  labels: string[];

  @ApiProperty({ type: [ChartDatasetDto], isArray: true })
  datasets: ChartDatasetDto[];
}
