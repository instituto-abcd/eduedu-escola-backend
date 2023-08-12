import { ApiProperty } from '@nestjs/swagger';
import { OptionsAnswers } from '../../../student/schemas/studentExam.schema';
import { Prop } from '@nestjs/mongoose';

export class OptionAnswer {
  @ApiProperty({ description: 'Position of the answered option', example: 0 })
  position: number;

  @ApiProperty({ description: 'Position of the answered option', example: 0 })
  positionAnswer: number;
}

export class AnswerRequestDto {
  @ApiProperty({ description: 'ID da pergunta', example: 1 })
  questionId: number;

  @ApiProperty({
    description: 'Options answered by their position',
    type: [OptionAnswer],
  })
  @Prop()
  optionsAnswered: OptionsAnswers[];

  isCorrect: boolean;
}
