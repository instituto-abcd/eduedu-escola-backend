import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';
import { PrismaService } from '../prisma/prisma.service';
import { DateApiService } from '../common/services/date-api.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Module({
  controllers: [SchoolYearController],
  providers: [
    SchoolYearService,
    PrismaService,
    DateApiService,
    DashboardService,
  ],
})
export class SchoolYearModule {}
