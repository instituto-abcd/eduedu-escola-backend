import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalApiService } from './external-api.service';

@Module({
  controllers: [SchoolYearController],
  providers: [SchoolYearService, PrismaService, ExternalApiService],
})
export class SchoolYearModule {}
