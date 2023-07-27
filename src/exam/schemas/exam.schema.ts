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
  order: number;
  description: string;
  fileUrl?: string;
  modelId: string;
  options: {
    order: number;
    description: string;
    isCorrect: boolean;
    imageUrl?: string;
    soundUrl?: string;
  }[];
};

export type IExam = {
  id: string;
  axis: IAxis;
  level: number;
  name: string;
  schoolYear: string;
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

  @Prop({ type: Axis })
  axis: Axis;

  @Prop()
  description: string;

  @Prop()
  schoolYear: string;

  @Prop()
  level: number;

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
