import { ApiProperty } from '@nestjs/swagger';

export class CreateAwardDto {
  @ApiProperty({
    description: 'Nome da conquista',
    example: 'Prêmio de Excelência',
  })
  name: string;

  title: string;
  description: string;
}
