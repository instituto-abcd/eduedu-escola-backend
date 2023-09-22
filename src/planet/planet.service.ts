import { Injectable } from '@nestjs/common';
import { PlanetDto } from './dto/planet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Planet,
  PlanetDocument,
  Question,
} from 'src/planet-sync/schemas/planet.schema';

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

  async findPlanetQuestion(
    planetId: string,
    questionId: string,
  ): Promise<Question> {
    const planet = await this.planetModel.findOne({
      id: planetId,
    });

    const result = planet.questions.find(
      (question) => question.id == questionId,
    );

    return result;
  }

  async findPlanetQuestions(planetId: string): Promise<Question[]> {
    const planet = await this.planetModel.findOne({
      id: planetId,
    });

    return planet.questions;
  }
}
