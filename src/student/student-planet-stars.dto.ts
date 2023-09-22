import { ApiProperty } from '@nestjs/swagger';

export class StudentPlanetStarsDto {
  @ApiProperty({ description: 'Nome do planeta', example: 'Andorinha' })
  planetName: string;

  @ApiProperty({ description: 'Estrelas' })
  stars: number;
}
