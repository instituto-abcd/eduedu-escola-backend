import { ApiProperty } from '@nestjs/swagger';

class PerformanceMetrics {
  @ApiProperty()
  percent: string;

  @ApiProperty()
  color: string;
}

export class PlanetPerformanceResponse {
  @ApiProperty({
    description: 'ID do estudante',
    example: 'guid',
  })
  studentId: string;

  @ApiProperty({
    description: 'Nome do estudante',
    example: 'Amanda',
  })
  studentName: string;

  @ApiProperty({
    description: 'Desempenho em CFO',
    type: PerformanceMetrics,
  })
  cfo: PerformanceMetrics;

  @ApiProperty({
    description: 'Desempenho em SEA',
    type: PerformanceMetrics,
  })
  sea: PerformanceMetrics;

  @ApiProperty({
    description: 'Desempenho em LCT',
    type: PerformanceMetrics,
  })
  lct: PerformanceMetrics;
}
