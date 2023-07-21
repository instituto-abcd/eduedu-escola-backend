import { ApiProperty } from '@nestjs/swagger';

export class CreateAwardDto {
  @ApiProperty({
    description: 'Nome do prêmio',
    example: 'Prêmio de Excelência',
  })
  name: string;
}
