import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
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
  lastExam: boolean;

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
  position: number;

  @Prop()
  availableAt: Date;

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
export class OptionsAnswersPlanet {
  @ApiProperty()
  @Prop()
  position: number;

  @ApiProperty()
  @Prop()
  positionAnswer: number;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiProperty()
  @Prop()
  isCorrect: boolean = false;
}

@Schema()
export class AnswersPlanet {
  @ApiProperty()
  @Prop()
  questionId: string;

  @ApiProperty({ type: OptionsAnswersPlanet, isArray: true })
  @Prop()
  optionsAnswered?: OptionsAnswersPlanet[];

  @ApiProperty()
  @Prop()
  isCorrect: boolean;

  @ApiProperty()
  @Prop()
  axis_code: string;

  @ApiProperty()
  @Prop()
  level: number;

  @ApiProperty()
  @Prop()
  order: number;

  @ApiProperty()
  @Prop()
  lastQuestion: boolean;
}

export const StudentExamSchema = SchemaFactory.createForClass(StudentExam);
export const PlanetSchema = SchemaFactory.createForClass(Planet);
