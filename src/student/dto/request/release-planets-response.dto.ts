import { ApiProperty } from '@nestjs/swagger';

export class ReleasePlanetsResponseDto {
  @ApiProperty({
    description: 'Planetas liberados para os Estudantes',
    example: true,
  })
  success: boolean;
}
