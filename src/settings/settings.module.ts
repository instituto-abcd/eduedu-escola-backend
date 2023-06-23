import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../common/services/bcrypt.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, PrismaService, BcryptService],
})
export class SettingsModule {}
