import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaService } from '../prisma/prisma.service';
import { DateApiService } from '../common/services/date-api.service';
import { SchoolYearService } from '../school-year/school-year.service';
import { PerformanceResultUtilsService } from '../common/utils/performance-result-utils.service';

@Module({
  exports: [PerformanceResultUtilsService],
  providers: [
    SchoolYearService,
    PrismaService,
    DateApiService,
    DashboardService,
    PerformanceResultUtilsService,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
