import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
    sound_url?: string;
    image_url?: string;
    description: string;
    position: number;
    isCorrect: boolean;
  }[];
  titles: {
    file_url: string | null;
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
  @Prop()
  avatar_url: string;

  @Prop()
  axis_code: string;

  @Prop()
  domain_code: string;

  @Prop()
  enable: boolean;

  @Prop()
  id: string;

  @Prop()
  level: string;

  @Prop()
  next_planet_id: string | null;

  @Prop()
  position: number;

  @Prop()
  status: string;

  @Prop()
  title: string;

  @Prop({ type: { seconds: Number, nanoseconds: Number }, _id: false })
  updated_at: { seconds: number; nanoseconds: number };

  @Prop()
  questions: Question[];
}

export const PlanetSchema = SchemaFactory.createForClass(Planet);
