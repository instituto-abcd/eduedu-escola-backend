import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { AuthService } from 'src/auth/auth.service';
import { DateApiService } from 'src/common/services/date-api.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { EmailService } from 'src/email/email.service';
import { UtilsModule } from '../common/utils/utils.module';

@Module({
  controllers: [UserController],
  exports: [ValidationUtilsService],
  providers: [
    UserService,
    PrismaService,
    ValidationUtilsService,
    BcryptService,
    AuthService,
    DateApiService,
    DashboardService,
    EmailService,
  ],
  imports: [UtilsModule],
})
export class UserModule {}
