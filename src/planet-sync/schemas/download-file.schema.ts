import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DownloadedFileDocument = HydratedDocument<DownloadedFile>;

@Schema({ collection: 'downloaded-files' })
export class DownloadedFile {
  @Prop()
  fileName: string;
}

export const DownloadedFileSchema =
  SchemaFactory.createForClass(DownloadedFile);
DownloadedFileSchema.index({ fileName: 1 }, { unique: true });
