import { ApiProperty } from '@nestjs/swagger';

export class QuestionTitleDto {
  @ApiProperty()
  file_url: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  position: number;

  @ApiProperty()
  placeholder: string;

  @ApiProperty()
  type: string;
}

export class QuestionPlanentDto {
  @ApiProperty()
  previousQuestionIsCorrect: boolean = false;

  @ApiProperty()
  progress: number = 0;

  @ApiProperty()
  orderedAnswer: boolean;

  @ApiProperty()
  level: number;

  @ApiProperty()
  axis_code: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  model_id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  planet_id: string;

  @ApiProperty()
  position: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  bncc: string;

  @ApiProperty()
  updated_at: {
    seconds: number;
    nanoseconds: number;
  };

  @ApiProperty({ type: [QuestionTitleDto] })
  titles: QuestionTitleDto[];

  @ApiProperty({ type: [Object] })
  options: any[]; // You can replace 'any' with a more specific type if needed

  @ApiProperty({ type: [Object] })
  rules: any[]; // You can replace 'any' with a more specific type if needed
}

export class PlanetDto {
  @ApiProperty()
  _id: {
    $oid: string;
  };

  @ApiProperty()
  id: string;

  @ApiProperty()
  avatar_url: string;

  @ApiProperty()
  axis_code: string;

  @ApiProperty()
  domain_code: string;

  @ApiProperty()
  enable: boolean;

  @ApiProperty()
  level: string;

  @ApiProperty()
  next_planet_id: string;

  @ApiProperty()
  position: number;

  @ApiProperty({ type: [QuestionPlanentDto] })
  questions: QuestionPlanentDto[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  updated_at: {
    seconds: number;
    nanoseconds: number;
  };
}
