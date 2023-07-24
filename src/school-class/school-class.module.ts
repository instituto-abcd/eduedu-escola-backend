import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SchoolClassController } from './school-class.controller';
import { SchoolClassService } from './school-class.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { DateApiService } from '../common/services/date-api.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';

@Module({
  controllers: [SchoolClassController],
  providers: [
    SchoolClassService,
    PrismaService,
    DashboardService,
    DateApiService,
    ValidationUtilsService,
  ],
})
export class SchoolClassModule {}
