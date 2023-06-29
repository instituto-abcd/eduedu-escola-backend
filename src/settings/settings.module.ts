import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { UserService } from 'src/user/user.service';
import { ValidationUtilsService } from 'src/common/utils/validation-utils.service';
import { AuthService } from 'src/auth/auth.service';
import { DateApiService } from 'src/common/services/date-api.service';

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    PrismaService,
    BcryptService,
    UserService,
    ValidationUtilsService,
    AuthService,
    DateApiService,
  ],
})
export class SettingsModule {}
