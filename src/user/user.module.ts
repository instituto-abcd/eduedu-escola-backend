import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationUtilsService } from './validationUtils.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, ValidationUtilsService],
})
export class UserModule {}
