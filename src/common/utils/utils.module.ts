import { Module } from '@nestjs/common';
import { DateFormatterUtilsService } from './date-formatter-utils.service';
import { PerformanceResultUtilsService } from './performance-result-utils.service';

@Module({
  providers: [DateFormatterUtilsService, PerformanceResultUtilsService],
  exports: [DateFormatterUtilsService, PerformanceResultUtilsService],
})
export class UtilsModule {}
