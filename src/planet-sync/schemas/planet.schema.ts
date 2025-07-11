import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { QuestionDto } from 'src/exam/dto/question.dto';

export type Question = {
  orderedAnswer: boolean;
  multiplesAnswer: boolean;
  level: number;
  id: string;
  model_id: string;
  description: string;
  planet_id: string;
  position: number;
  status: string;
  title: string;
  bncc: string | null;
  updated_at: string;
  options: {
    sound_id?: string;
    sound_url?: string;
    image_id?: string;
    image_url?: string;
    description: string;
    position: number;
    isCorrect: boolean;
    id: string;
  }[];
  titles: {
    file_id?: string | null;
    file_url?: string | null;
    description: string;
    position: number;
    placeholder: string;
    type: string;
  }[];
  rules: {
    name: string;
    type: string;
    value: string;
  }[];
};

export type PlanetDocument = HydratedDocument<Planet>;

@Schema()
export class Planet {
  @ApiProperty()
  @Prop()
  avatar_id: string;

  @ApiProperty()
  @Prop()
  avatar_url: string;

  @ApiProperty()
  @Prop()
  axis_code: string;

  @ApiProperty()
  @Prop()
  domain_code: string;

  @ApiProperty()
  @Prop()
  enable: boolean;

  @ApiProperty()
  @Prop()
  id: string;

  @ApiProperty()
  @Prop()
  level: string;

  @ApiProperty()
  @Prop()
  next_planet_id: string | null;

  @ApiProperty()
  @Prop()
  position: number;

  @ApiProperty()
  @Prop()
  status: string;

  @ApiProperty()
  @Prop()
  title: string;

  @ApiProperty()
  @Prop({ type: { seconds: Number, nanoseconds: Number }, _id: false })
  updated_at: { seconds: number; nanoseconds: number };

  @ApiProperty({ type: QuestionDto, isArray: true })
  @Prop()
  questions: Question[];
}

export const PlanetSchema = SchemaFactory.createForClass(Planet);
