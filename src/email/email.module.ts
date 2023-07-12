import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BcryptService } from 'src/common/services/bcrypt.service';

@Module({
  providers: [EmailService, PrismaService, BcryptService],
})
export class EmailModule {}
