import { ApiProperty } from '@nestjs/swagger';

export class AnswersPlanetResponseDto {
  @ApiProperty({ description: 'Prova do Planeta Finaliada?', example: true })
  planetCompleted: boolean;

  @ApiProperty({ description: 'Progresso da Prova', example: 0.51 })
  progress?: number = 0;
}
