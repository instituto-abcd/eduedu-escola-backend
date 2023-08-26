import { ApiProperty } from '@nestjs/swagger';

class PerformanceData {
  @ApiProperty({ type: Number, example: 4.5 })
  averageStars: number;
}

export class PlanetsPerformanceResponse {
  @ApiProperty({ type: String, example: 'guid' })
  studentId: string;

  @ApiProperty({ type: String, example: 'Amanda' })
  studentName: string;

  @ApiProperty({ type: String, example: '2023-08-25T13:34:05.719Z' })
  lastExamDate: string;

  @ApiProperty({ type: PerformanceData })
  cfo: PerformanceData;

  @ApiProperty({ type: PerformanceData })
  sea: PerformanceData;

  @ApiProperty({ type: PerformanceData })
  lct: PerformanceData;
}
