import { ApiProperty } from '@nestjs/swagger';
import { OptionsAnswers } from '../../../student/schemas/studentExam.schema';
import { Prop } from '@nestjs/mongoose';

export class OptionAnswer {
  @ApiProperty({ description: 'URL do som', example: 0 })
  sound_url: number;

  @ApiProperty({ description: 'URL da imagem do planeta', example: 0 })
  image_url: number;

  @ApiProperty({ description: 'Descrição', example: 0 })
  description: number;

  @ApiProperty({ description: 'Posição', example: 0 })
  position: number;

  @ApiProperty({ description: 'Está correta?', example: 0 })
  isCorrect: number;

  @ApiProperty({ description: 'Resposta do aluno', example: 0 })
  positionAnswer: number;
}

export class AnswerPlanetRequestDto {
  @ApiProperty({ description: 'ID da pergunta', example: 1 })
  questionId: number;

  @ApiProperty({
    description: 'Opções de resposta da prova',
    type: [OptionAnswer],
  })
  @Prop()
  optionsAnswered: OptionsAnswers[];
}
