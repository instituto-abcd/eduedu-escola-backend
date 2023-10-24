import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';
import { PrismaService } from '../prisma/prisma.service';
import { DateApiService } from '../common/services/date-api.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { UtilsModule } from '../common/utils/utils.module';

@Module({
  controllers: [SchoolYearController],
  providers: [
    SchoolYearService,
    PrismaService,
    DateApiService,
    DashboardService,
  ],
  imports: [UtilsModule],
})
export class SchoolYearModule {}
