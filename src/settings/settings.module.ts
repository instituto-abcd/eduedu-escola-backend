import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { DateApiService } from '../common/services/date-api.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    PrismaService,
    BcryptService,
    UserService,
    AuthService,
    DashboardService,
    DateApiService,
    ValidationUtilsService,
    EmailService,
  ],
})
export class SettingsModule {}
