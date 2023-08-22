import { Injectable } from '@nestjs/common';
import { PlanetDto } from './dto/planet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Planet, PlanetDocument } from 'src/planet-sync/schemas/planet.schema';

@Injectable()
export class PlanetService {

  constructor(
    @InjectModel(Planet.name)
    private planetModel: Model<PlanetDocument>,
  ) {}

  async findAll(): Promise<PlanetDto[]> {
    const planets = await this.planetModel.find();
    return planets;
  }

}
