import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

type Question = {
  axis_id: string;
  description: string;
  domain: string;
  id: string;
  level: number;
  model_id: string;
  planet_id: string;
  position: number;
  status: string;
  title: string;
  bncc: string | null;
  updated_at: string;
  rules: {
    name: string;
    type: string;
    value: string;
  }[];
  options: {
    description: string | null;
    image_id: string | null | undefined;
    image_url_origin: string | null;
    image_url: string | null;
    isCorrect: boolean;
    sound_id: string | null | undefined;
    sound_url_origin: string | null;
    sound_url: string | null;
    id: number;
    url: string;
  }[];
  titles: {
    description: string;
    file_id: string;
    file_url_origin: string | null;
    file_url: string | null;
    placeholder: string;
    position: number;
    type: string;
    required: boolean;
    id: number;
  }[];
};

export type PlanetDocument = HydratedDocument<Planet>;

@Schema()
export class Planet {
  @Prop()
  avatar: string;

  @Prop()
  avatar_url_origin: string;

  @Prop()
  avatar_url: string;

  @Prop()
  axis_id: string;

  @Prop()
  domain_code: string;

  @Prop()
  enable: boolean;

  @Prop()
  id: string;

  @Prop()
  level: string;

  @Prop()
  min_bundle_version: number | null;

  @Prop()
  next_bundle_id: string | null;

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
