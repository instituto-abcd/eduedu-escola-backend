import { ApiProperty } from '@nestjs/swagger';

export class AwardDto {
  @ApiProperty({
    description: 'ID da conquista',
    example: '2f7bc4d2-8e92-4ad0-ae2a-b3e276d87b34',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da conquista',
    example: 'Primeiro planeta',
  })
  name: string;
}
