import { ApiProperty } from '@nestjs/swagger';
import { PlanetDto } from './planet.dto';

export class PlanetTrackDto {
  @ApiProperty({ description: 'ID do estudante', example: 'uuid' })
  studentId: string;

  @ApiProperty({ description: 'ID da prova', example: 'uuid' })
  examId: string;

  @ApiProperty({
    description: 'Data da prova',
    example: '2023-01-01T15:30:00.000Z',
  })
  examDate: Date;

  @ApiProperty({ description: 'Prova atual?', example: true })
  current: boolean;

  @ApiProperty({ description: 'Detalhes da trilha dos planetas' })
  planetTrack: PlanetDto[];
}
