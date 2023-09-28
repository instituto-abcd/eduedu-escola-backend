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

  async findPlanetModels() : Promise<any> {
    const planets = await this.planetModel.find();
    const questions = planets.reduce((question, planet) => [ ...question, ...planet.questions ], []);

    const models = questions.map((question) => {
      return question.model_id
    });

    const uniqueModels = models.filter((n, i) => models.indexOf(n) === i);

    return uniqueModels;
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

  async findAllPlanetQuestions(
    modelId: string,
  ): Promise<Question[]> {

    const aggregationResults: any[] = await this.planetModel
        .aggregate([
          {
            $match: { 'questions.model_id': modelId },
          },
          {
            $project: {
              questions: {
                $filter: {
                  input: '$questions',
                  as: 'question',
                  cond: { $eq: ['$$question.model_id', modelId] },
                },
              },
            },
          },
        ])
        .exec();

    let questions = aggregationResults.reduce((question, result) => [ ...question, ...result.questions ], []);

    return questions;
  }
}
