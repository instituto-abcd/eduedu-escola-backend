import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

type IPlanetSync = {
  planetId: string;
  synced: boolean;
  syncedAt: Date | null;
  receivedAt: Date;
};

export type PlanetSyncDocument = HydratedDocument<PlanetSync>;

@Schema({ collection: 'planet-sync' })
export class PlanetSync {
  @Prop()
  planetId: string;

  @Prop({ default: false })
  synced: boolean;

  @Prop({ default: null })
  syncedAt: Date | null;

  @Prop({ default: Date.now() })
  receivedAt: Date;
}

export const PlanetSyncSchema = SchemaFactory.createForClass(PlanetSync);
PlanetSyncSchema.index({ planetId: 1 }, { unique: true });
