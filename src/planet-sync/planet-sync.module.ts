import { Module } from '@nestjs/common';
import { PlanetSyncProcessor, PlanetSyncService } from './planet-sync.service';
import { PlanetSyncController } from './planet-sync.controller';
import { Planet, PlanetSchema } from './schemas/planet.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from './gateway.service';
import { PlanetSync, PlanetSyncSchema } from './schemas/sync-list.schema';
import { StorageService } from './storage.service';
import { BullModule } from '@nestjs/bull';
import { UtilsModule } from '../common/utils/utils.module';
import {
  DownloadedFile,
  DownloadedFileSchema,
} from './schemas/download-file.schema';
import { StudentService } from '../student/student.service';
import {
  StudentExam,
  StudentExamSchema,
} from '../student/schemas/studentExam.schema';
import { Exam, ExamSchema } from '../exam/schemas/exam.schema';
import { PerformanceResultUtilsService } from '../common/utils/performance-result-utils.service';
import { StudentResultService } from '../student/studentResult.service';
import { PlanetService } from '../planet/planet.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { DateApiService } from '../common/services/date-api.service';
import { StudentExamService } from '../student/studentExam.service';
import { AwardsService } from '../awards/awards.service';
import { StudentAwardService } from '../student/studentAward.service';
import { StudentPlanetExecutionService } from '../student/studentPlanetExecution.service';
import { LastSync, LastSyncSchema } from './schemas/last-sync.schema';
import { AccessKeyService } from 'src/access-key/accessKey.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentExam.name, schema: StudentExamSchema },
      { name: Planet.name, schema: PlanetSchema },
      { name: PlanetSync.name, schema: PlanetSyncSchema },
      { name: LastSync.name, schema: LastSyncSchema },
      { name: DownloadedFile.name, schema: DownloadedFileSchema },
      { name: Exam.name, schema: ExamSchema },
    ]),
    BullModule.registerQueueAsync({ name: 'planet-sync' }),
    UtilsModule,
  ],
  controllers: [PlanetSyncController],
  providers: [
    PlanetSyncService,
    PrismaService,
    GatewayService,
    StorageService,
    PlanetSyncProcessor,
    PlanetService,
    StudentService,
    ValidationUtilsService,
    BcryptService,
    DashboardService,
    DateApiService,
    StudentExamService,
    AwardsService,
    StudentAwardService,
    StudentResultService,
    StudentPlanetExecutionService,
    PerformanceResultUtilsService,
    AccessKeyService,
  ],
  exports: [
    PlanetSyncModule,
    GatewayService,
    StorageService,
    BullModule,
    PerformanceResultUtilsService,
    StudentResultService,
  ],
})
export class PlanetSyncModule {}
