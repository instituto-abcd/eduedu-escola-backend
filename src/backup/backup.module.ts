import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupScheduleService } from './backup-schedule.service';
import { BackupController } from './backup.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BackupController],
  providers: [BackupService, BackupScheduleService, PrismaService],
})
export class BackupModule {}
