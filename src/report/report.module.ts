import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StudentModule } from '../student/student.module';
import { StudentResultService } from '../student/studentResult.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StudentExam,
  StudentExamSchema,
} from '../student/schemas/studentExam.schema';
import { Exam, ExamSchema } from '../exam/schemas/exam.schema';
import { Planet, PlanetSchema } from '../planet-sync/schemas/planet.schema';

@Module({
  controllers: [ReportController],
  providers: [ReportService, PrismaService],
  imports: [
    StudentModule,
    MongooseModule.forFeature([
      { name: StudentExam.name, schema: StudentExamSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: Planet.name, schema: PlanetSchema },
    ]),
  ],
})
export class ReportModule {}
