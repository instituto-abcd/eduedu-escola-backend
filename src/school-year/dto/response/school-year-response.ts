import { ApiProperty } from '@nestjs/swagger';

export class SchoolYearResponse {
  @ApiProperty({
    description: 'O id do ano letivo',
    example: 'e57136f7-9df1-4644-b9a7-bfddfd799c77',
  })
  id: string;

  @ApiProperty({ description: 'O nome do ano letivo', example: 2023 })
  name: number;

  @ApiProperty({ description: 'O status do ano letivo', example: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';

  @ApiProperty({
    description: 'A data de criação do ano letivo',
    example: '2023-06-07T14:23:40.740Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'A data da última atualização do ano letivo',
    example: '2023-06-07T14:23:40.740Z',
  })
  updatedAt: Date;
}
