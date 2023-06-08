import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { BcryptService } from '../common/services/bcrypt.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    ValidationUtilsService,
    BcryptService,
  ],
})
export class UserModule {}
