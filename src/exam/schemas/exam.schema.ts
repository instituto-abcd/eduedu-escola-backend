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

export type Question = {
  orderedAnswer: boolean;
  level: number;
  axis_code: string;
  id: number;
  model_id: string;
  category: string;
  description: string;
  school_year: number;
  order: number;
  options: {
    image_name?: string;
    sound_url?: string;
    image_url?: string;
    sound_name?: string;
    description: string;
    position: number;
    isCorrect: boolean;
  }[];
  titles: {
    file_url: string;
    file_name: string;
    description: string;
    position: number;
    placeholder: string;
    type: string;
  }[];
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
