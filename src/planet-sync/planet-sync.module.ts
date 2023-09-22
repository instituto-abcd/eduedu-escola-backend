import { Module } from '@nestjs/common';
import { PlanetSyncProcessor, PlanetSyncService } from './planet-sync.service';
import { PlanetSyncController } from './planet-sync.controller';
import { Planet, PlanetSchema } from './schemas/planet.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirestoreService } from './firestore.service';
import { PlanetSync, PlanetSyncSchema } from './schemas/sync-list.schema';
import { StorageService } from './storage.service';
import { BullModule } from '@nestjs/bull';
import { UtilsModule } from 'src/common/utils/utils.module';
import { DownloadedFile, DownloadedFileSchema } from './schemas/download-file.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Planet.name, schema: PlanetSchema },
      { name: PlanetSync.name, schema: PlanetSyncSchema },
      { name: DownloadedFile.name, schema: DownloadedFileSchema },
    ]),
    BullModule.registerQueueAsync(
      { name: 'planet-sync' },
    ),
    UtilsModule,
  ],
  controllers: [PlanetSyncController],
  providers: [PlanetSyncService, PrismaService, FirestoreService, StorageService, PlanetSyncProcessor ],
  exports: [PlanetSyncModule, FirestoreService, StorageService, BullModule ],
})
export class PlanetSyncModule {}
