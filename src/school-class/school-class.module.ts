import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SchoolClassController } from './school-class.controller';
import { SchoolClassService } from './school-class.service';

@Module({
  controllers: [SchoolClassController],
  providers: [SchoolClassService, PrismaService],
})
export class SchoolClassModule {}
