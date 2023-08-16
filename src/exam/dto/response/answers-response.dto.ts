import { ApiProperty } from '@nestjs/swagger';

export class AnswersResponseDto {
  @ApiProperty({ description: 'Prova Finaliada?', example: true })
  examCompleted: boolean;

  @ApiProperty({ description: 'Progresso da Prova', example: 0.51 })
  progress?: number = 0;
}
