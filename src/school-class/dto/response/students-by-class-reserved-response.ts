import { ApiProperty } from '@nestjs/swagger';

export class StudentsByClassResponseDto {
  @ApiProperty({ description: 'ID do aluno', example: 'Guid' })
  id: string;

  @ApiProperty({ description: 'Nome do aluno', example: 'Denis o Pimentinha' })
  name: string;

  @ApiProperty({ description: 'Registro do aluno', example: '12345' })
  registry: string;
}