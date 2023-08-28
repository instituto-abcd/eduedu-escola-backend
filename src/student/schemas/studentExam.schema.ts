import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StudentExamDocument = StudentExam & Document;

@Schema()
export class StudentExam {
  @Prop()
  studentId: string;

  @Prop()
  examId: string;

  @Prop()
  examDate: Date;

  @Prop()
  current: boolean;

  @Prop()
  examPerformed: boolean;

  @Prop()
  planetTrack: Planet[];

  createdAt?: Date;
  updatedAt?: Date;

  @Prop()
  answers?: Answers[];
}

@Schema()
export class Planet {
  @Prop()
  planetId: string;

  @Prop()
  planetName: string;

  @Prop()
  planetAvatar: string;

  @Prop()
  axis_code: string;

  @Prop()
  order: number;

  @Prop()
  level: string;

  @Prop()
  answers?: AnswersPlanet[];
}

@Schema()
export class Answers {
  @Prop()
  questionId: number;

  @Prop()
  optionsAnswered?: OptionsAnswers[];

  @Prop()
  isCorrect: boolean;

  @Prop()
  axis_code: string;

  @Prop()
  level: number;

  @Prop()
  order: number;

  @Prop()
  category: string;

  @Prop()
  school_year: number;

  @Prop()
  lastQuestion: boolean;

  @Prop()
  autoAssignedAnswer: boolean;
}

@Schema()
export class OptionsAnswers {
  @Prop()
  position: number;
  @Prop()
  positionAnswer: number;
}

@Schema()
export class AnswersPlanet {
  @Prop()
  questionId: string;

  @Prop()
  optionsAnswered?: OptionsAnswersPlanet[];

  @Prop()
  isCorrect: boolean;

  @Prop()
  axis_code: string;

  @Prop()
  level: number;

  @Prop()
  order: number;

  @Prop()
  lastQuestion: boolean;
}

@Schema()
export class OptionsAnswersPlanet {
  @Prop()
  position: number;
  @Prop()
  positionAnswer: number;
}

export const StudentExamSchema = SchemaFactory.createForClass(StudentExam);
export const PlanetSchema = SchemaFactory.createForClass(Planet);
