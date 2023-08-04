import { ApiProperty } from '@nestjs/swagger';

export class PlanetDto {
  @ApiProperty({ description: 'ID do planeta', example: 'uuid' })
  planetId: string;

  @ApiProperty({ description: 'Nome do planeta', example: 'Saturno' })
  planetName: string;

  @ApiProperty({
    description: 'URL do avatar do planeta',
    example: 'https://example.com/planet_avatar.jpg',
  })
  planetAvatar: string;

  @ApiProperty({ description: 'Pontuação no planeta', example: 100.0 })
  score: number;

  @ApiProperty({ description: 'Número de estrelas no planeta', example: 4.5 })
  stars: number;
}
