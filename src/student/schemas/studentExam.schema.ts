import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OptionAnswer } from '../../exam/dto/request/answers-request.dto';

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
  score: number;

  @Prop()
  stars: number;
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
}

@Schema()
export class OptionsAnswers {
  @Prop()
  position: number;
  @Prop()
  positionAnswer: number;
}

export const StudentExamSchema = SchemaFactory.createForClass(StudentExam);
export const PlanetSchema = SchemaFactory.createForClass(Planet);
