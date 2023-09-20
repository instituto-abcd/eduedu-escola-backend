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
import { FtpModule } from 'src/ftp/ftp.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Planet.name, schema: PlanetSchema },
      { name: PlanetSync.name, schema: PlanetSyncSchema },
    ]),
    BullModule.registerQueueAsync(
      { name: 'planet-sync' },
    ),
    FtpModule,
  ],
  controllers: [PlanetSyncController],
  providers: [PlanetSyncService, PrismaService, FirestoreService, StorageService, PlanetSyncProcessor ],
  exports: [PlanetSyncModule, FirestoreService, StorageService, BullModule ],
})
export class PlanetSyncModule {}
