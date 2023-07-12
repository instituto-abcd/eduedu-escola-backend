import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { DashboardService } from '../dashboard/dashboard.service';
import { DateApiService } from '../common/services/date-api.service';

@Module({
  controllers: [StudentController],
  providers: [
    StudentService,
    PrismaService,
    ValidationUtilsService,
    BcryptService,
    DashboardService,
    DateApiService,
  ],
})
export class StudentModule {}
