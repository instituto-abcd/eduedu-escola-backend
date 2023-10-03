import { Module } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetController } from './planet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Planet, PlanetSchema } from 'src/planet-sync/schemas/planet.schema';
import { Exam, ExamSchema } from 'src/exam/schemas/exam.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Planet.name, schema: PlanetSchema },
      { name: Exam.name, schema: ExamSchema }
    ]),
  ],
  controllers: [PlanetController],
  providers: [PlanetService]
})
export class PlanetModule {}
