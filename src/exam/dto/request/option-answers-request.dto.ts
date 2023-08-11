import { ApiProperty } from '@nestjs/swagger';
import { OptionAnswer } from './answers-request.dto';

export class AnswerRequestDto {
  @ApiProperty({ description: 'ID da pergunta', example: 1 })
  questionId: number;

  @ApiProperty({
    description: 'Options answered by their position',
    type: [OptionAnswer],
  })
  optionsAnswered: OptionAnswer[];
}
