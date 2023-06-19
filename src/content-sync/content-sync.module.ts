import { Module } from '@nestjs/common';
import { ContentSyncService } from './content-sync.service';
import { ContentSyncController } from './content-sync.controller';
import { Planet, PlanetSchema } from './schemas/planet.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirestoreService } from './firestore.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Planet.name, schema: PlanetSchema }]),
  ],
  controllers: [ContentSyncController],
  providers: [ContentSyncService, PrismaService, FirestoreService],
})
export class ContentSyncModule {}
