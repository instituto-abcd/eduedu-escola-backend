import { ApiProperty } from '@nestjs/swagger';
import { QuestionTitleDto } from './question-planet.dto';

export class QuestionDto {
  @ApiProperty({ description: 'ID da questão' })
  id: number;

  @ApiProperty({ description: 'Código de eixo' })
  axis_code: string;

  @ApiProperty({ description: 'Ordenação da questão' })
  order: number;

  @ApiProperty({ description: 'Categoria' })
  category: string;

  @ApiProperty({ description: 'Ano letivo' })
  school_year: number;

  @ApiProperty({ description: 'Nível' })
  level: number;

  @ApiProperty({ description: 'Descrição' })
  description: string;

  @ApiProperty({ description: 'ID do modelo' })
  model_id: string;

  @ApiProperty({ description: 'Resposta ordenada' })
  orderedAnswer: boolean;

  @ApiProperty({ description: 'Progresso %' })
  progress?: number = 0;

  // TODO: add title type
  @ApiProperty({ type: QuestionTitleDto, isArray: true })
  titles: {
    file_name: string;
    file_url: string;
    description: string;
    position: number;
    placeholder: string;
    type: string;
  }[];

  // TODO: add title type
  @ApiProperty({ type: Object, isArray: true })
  options: {
    sound_name?: string;
    sound_url?: string | null;
    image_name?: string;
    image_url?: string | null;
    description: string;
    isCorrect: boolean;
    position: number;
    id: string;
  }[];
}
