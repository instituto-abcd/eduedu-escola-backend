import { Module } from '@nestjs/common';
import { ExamService, ExamSyncProcessor } from './exam.service';
import { ExamController } from './exam.controller';
import { GatewayService } from '../planet-sync/gateway.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Exam, ExamSchema } from './schemas/exam.schema';
import { LastExamSync, LastExamSyncSchema } from './schemas/last-exam-sync.schema';
import { PlanetSyncModule } from '../planet-sync/planet-sync.module';
import { ExamStorageService } from './exam-storage.service';
import { BullModule } from '@nestjs/bull';
import { UtilsModule } from '../common/utils/utils.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: LastExamSync.name, schema: LastExamSyncSchema },
    ]),
    BullModule.registerQueueAsync({ name: 'exam-sync' }),
    PlanetSyncModule,
    UtilsModule,
  ],
  controllers: [ExamController],
  providers: [
    ExamService,
    ExamSyncProcessor,
    ExamStorageService,
    GatewayService,
  ],
})
export class ExamModule {}
