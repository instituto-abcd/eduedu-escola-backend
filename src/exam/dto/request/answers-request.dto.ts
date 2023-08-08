import { ApiProperty } from '@nestjs/swagger';

export class AnswerRequestDto {
  @ApiProperty({ description: 'ID da pergunta', example: 1 })
  questionId: number;

  @ApiProperty({ description: 'Código do eixo', example: 'EA' })
  axis_code: string;

  @ApiProperty({
    description: 'Resposta para a pergunta (posição em options)',
    example: 1,
  })
  answeredValue: number;

  @ApiProperty({ description: 'Nível da pergunta', example: 3 })
  level: number;

  @ApiProperty({ description: 'Ano escolar', example: 2 })
  school_year: number;
  model_id: string;
}
