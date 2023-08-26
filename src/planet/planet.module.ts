import { Module } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetController } from './planet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Planet, PlanetSchema } from 'src/planet-sync/schemas/planet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Planet.name, schema: PlanetSchema },
    ]),
  ],
  controllers: [PlanetController],
  providers: [PlanetService]
})
export class PlanetModule {}
