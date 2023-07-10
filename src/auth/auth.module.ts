import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserModule } from '../user/user.module';
import { SchoolYearModule } from '../school-year/school-year.module';
import { DateApiService } from '../common/services/date-api.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [UserModule, SchoolYearModule, AuthModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    DateApiService,
    BcryptService,
    EmailService,
  ],
})
export class AuthModule {}
