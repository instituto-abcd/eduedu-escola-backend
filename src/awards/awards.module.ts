import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AwardsController } from './awards.controller';
import { AwardsService } from './awards.service';

@Module({
  providers: [AwardsService, PrismaService],
  controllers: [AwardsController],
})
export class AwardsModule {}
