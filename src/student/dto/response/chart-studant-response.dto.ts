import { ApiProperty } from '@nestjs/swagger';
import { ChartDatasetDto } from './chart-dataset-dto';

export class ChartStudentResponse {
  @ApiProperty({
    type: [String],
    example: ['10/01', '15/01', '20/03', '25/04'],
  })
  labels: string[];

  // TODO: datasets types
  @ApiProperty({ type: [ChartDatasetDto], isArray: true })
  datasets: ChartDatasetDto[];
}
