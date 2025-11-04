import { Module } from '@nestjs/common';
import { AccessKeyService } from './accessKey.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [],
  providers: [AccessKeyService, PrismaService],
  imports: [],
})
export class AccessKeyModule {}
