import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { DashboardService } from '../dashboard/dashboard.service';
import { DateApiService } from '../common/services/date-api.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentExam, StudentExamSchema } from './schemas/studentExam.schema';
import { StudentExamService } from './studentExam.service';
import { AwardsService } from '../awards/awards.service';
import { Exam, ExamSchema } from '../exam/schemas/exam.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentExam.name, schema: StudentExamSchema },
      { name: Exam.name, schema: ExamSchema },
    ]),
  ],
  controllers: [StudentController],
  providers: [
    StudentService,
    PrismaService,
    ValidationUtilsService,
    BcryptService,
    DashboardService,
    DateApiService,
    StudentExamService,
    AwardsService,
  ],
})
export class StudentModule {}
