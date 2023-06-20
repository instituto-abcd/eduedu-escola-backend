import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';

@Module({
  controllers: [StudentController],
  providers: [
    StudentService,
    PrismaService,
    ValidationUtilsService,
    BcryptService,
  ],
})
export class StudentModule {}
