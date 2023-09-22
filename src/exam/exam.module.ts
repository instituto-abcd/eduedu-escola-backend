import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { FirestoreService } from 'src/planet-sync/firestore.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Exam, ExamSchema } from './schemas/exam.schema';
import { PlanetSyncModule } from 'src/planet-sync/planet-sync.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Exam.name, schema: ExamSchema }]),
    PlanetSyncModule,
  ],
  controllers: [ExamController],
  providers: [ExamService, FirestoreService],
})
export class ExamModule {}
