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

  @ApiProperty({ description: 'Número de estrelas no planeta', example: 4.5 })
  stars: number;

  @ApiProperty({ description: 'Indicador se o planeta pode ser executado', example: true })
  canExecutePlanet: boolean;
}
