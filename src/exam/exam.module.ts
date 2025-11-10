import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { GatewayService } from '../planet-sync/gateway.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Exam, ExamSchema } from './schemas/exam.schema';
import { PlanetSyncModule } from '../planet-sync/planet-sync.module';
import { AccessKeyService } from 'src/access-key/accessKey.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Exam.name, schema: ExamSchema }]),
    PlanetSyncModule,
  ],
  controllers: [ExamController],
  providers: [ExamService, GatewayService, AccessKeyService, PrismaService],
})
export class ExamModule {}
