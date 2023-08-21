import { ApiProperty } from '@nestjs/swagger';

export class AnswersResponseDto {
  @ApiProperty({ description: 'Prova Finaliada?', example: true })
  examCompleted: boolean;
}
