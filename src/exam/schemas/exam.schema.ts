import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

type IAxis = {
  name: string;
  description: string;
  color: string;
  order: number;
  code: string;
  domain: 'PORTUGUESE' | 'MATH';
};

type Question = {
  axis_code: string;
  category: string;
  description: string;
  id: number;
  level: number;
  model_id: string;
  options: {
    description: string;
    image_name?: string;
    image_url?: string;
    isCorrect: boolean;
    position: number;
    sound_name?: string;
    sound_url?: string;
  }[];
  order: number;
  school_year: number;
  titles: {
    description: string;
    file_name: string;
    file_url: string;
    placeholder: string;
    position: number;
    type: string;
  }[]
};

export type IExam = {
  id: string;
  domain_code: string;
  status: string;
  questions: Question[];
  version: number;
};

class Axis {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  color: string;

  @Prop()
  order: number;

  @Prop()
  code: string;

  @Prop()
  domain: 'PORTUGUESE' | 'MATH';
}

export type ExamDocument = HydratedDocument<Exam>;

@Schema()
export class Exam {
  @Prop()
  id: string;

  @Prop()
  domain_code: string;

  @Prop()
  status: string;

  @Prop()
  questions: Question[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  version: number;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
