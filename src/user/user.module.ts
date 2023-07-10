import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { AuthService } from 'src/auth/auth.service';
import { DateApiService } from 'src/common/services/date-api.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    ValidationUtilsService,
    BcryptService,
    AuthService,
    DateApiService,
    EmailService,
  ],
})
export class UserModule {}
