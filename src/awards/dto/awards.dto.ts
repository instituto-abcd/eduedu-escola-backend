import { ApiProperty } from '@nestjs/swagger';

export class AwardDto {
  @ApiProperty({
    description: 'Nome único identificador da conquista',
    example: 'nome_da_conquista',
  })
  name: string;

  @ApiProperty({
    description: 'Título da conquista que aparecerá em interface',
    example: 'Primeiro planeta',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição da conquista',
    example: 'Completou 2 avaliações',
  })
  description: string;
}
