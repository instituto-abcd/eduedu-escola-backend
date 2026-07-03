import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LastExamSyncDocument = HydratedDocument<LastExamSync>;

@Schema({ collection: 'last-exam-sync' })
export class LastExamSync {
  @Prop({ default: Date.now })
  syncedAt: Date;
}

export const LastExamSyncSchema = SchemaFactory.createForClass(LastExamSync);
