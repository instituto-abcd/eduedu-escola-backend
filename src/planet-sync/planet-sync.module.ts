import { Module } from '@nestjs/common';
import { PlanetSyncService } from './planet-sync.service';
import { PlanetSyncController } from './planet-sync.controller';
import { Planet, PlanetSchema } from './schemas/planet.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirestoreService } from './firestore.service';
import { PlanetSync, PlanetSyncSchema } from './schemas/sync-list.schema';
import { StorageService } from './storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Planet.name, schema: PlanetSchema },
      { name: PlanetSync.name, schema: PlanetSyncSchema },
    ]),
  ],
  controllers: [PlanetSyncController],
  providers: [PlanetSyncService, PrismaService, FirestoreService, StorageService],
  exports: [PlanetSyncModule, FirestoreService, StorageService],
})
export class PlanetSyncModule {}
