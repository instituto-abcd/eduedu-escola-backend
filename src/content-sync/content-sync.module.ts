import { Module } from '@nestjs/common';
import { ContentSyncService } from './content-sync.service';
import { ContentSyncController } from './content-sync.controller';
import { Planet, PlanetSchema } from './schemas/planet.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirestoreService } from './firestore.service';
import { PlanetSync, PlanetSyncSchema } from './schemas/sync-list.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Planet.name, schema: PlanetSchema },
      { name: PlanetSync.name, schema: PlanetSyncSchema },
    ]),
  ],
  controllers: [ContentSyncController],
  providers: [ContentSyncService, PrismaService, FirestoreService],
  exports: [ContentSyncModule],
})
export class ContentSyncModule {}
