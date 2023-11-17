import { Module } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetController } from './planet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Planet, PlanetSchema } from 'src/planet-sync/schemas/planet.schema';
import { Exam, ExamSchema } from 'src/exam/schemas/exam.schema';
import { StudentService } from '../student/student.service';
import {
  StudentExam,
  StudentExamSchema,
} from '../student/schemas/studentExam.schema';
import { PerformanceResultUtilsService } from '../common/utils/performance-result-utils.service';
import { StudentResultService } from '../student/studentResult.service';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { DateApiService } from '../common/services/date-api.service';
import { StudentExamService } from '../student/studentExam.service';
import { AwardsService } from '../awards/awards.service';
import { StudentAwardService } from '../student/studentAward.service';
import { StudentPlanetExecutionService } from '../student/studentPlanetExecution.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentExam.name, schema: StudentExamSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: Planet.name, schema: PlanetSchema },
    ]),
  ],
  exports: [PerformanceResultUtilsService, StudentResultService],
  controllers: [PlanetController],
  providers: [
    PlanetService,
    StudentService,
    PrismaService,
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
  ],
})
export class PlanetModule {}
