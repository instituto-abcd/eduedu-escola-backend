import { ApiProperty } from '@nestjs/swagger';

export class AwardDto {
  @ApiProperty({
    description: 'ID do prêmio',
    example: '2f7bc4d2-8e92-4ad0-ae2a-b3e276d87b34',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do prêmio',
    example: 'Prêmio de Excelência',
  })
  name: string;
}

export class StudentAwardsResponseDto {
  @ApiProperty({
    type: [AwardDto],
    description: 'Lista de prêmios do estudante',
  })
  awards: AwardDto[];
}
