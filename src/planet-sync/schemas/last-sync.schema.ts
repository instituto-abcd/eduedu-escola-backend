import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LastSyncDocument = HydratedDocument<LastSync>;

@Schema({ collection: 'last-sync' })
export class LastSync {
  @Prop({ default: Date.now })
  syncedAt: Date;
}

export const LastSyncSchema = SchemaFactory.createForClass(LastSync);
