import { ApiProperty } from '@nestjs/swagger';

export class PlanetAxis {
  @ApiProperty()
  planetId: string;

  @ApiProperty()
  planetName: string;

  @ApiProperty()
  stars: number;
}
