import { Injectable } from '@nestjs/common';
import { PlanetDto } from './dto/planet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Planet,
  PlanetDocument,
  Question,
} from 'src/planet-sync/schemas/planet.schema';
import { Exam, ExamDocument } from 'src/exam/schemas/exam.schema';

@Injectable()
export class PlanetService {
  constructor(
    @InjectModel(Planet.name)
    private planetModel: Model<PlanetDocument>,
    @InjectModel(Exam.name)
    private examModel: Model<ExamDocument>,
  ) {}

  async findAll(): Promise<PlanetDto[]> {
    const planets = await this.planetModel.find();
    return planets;
  }

  async findPlanetModels() : Promise<any> {
    const planets = await this.planetModel.find();
    const questions = planets.reduce((question, planet) => [ ...question, ...planet.questions ], []);

    let models = questions.map((question) => {
      return question.model_id
    });

    let examModels = await this.findExamModels();
    models.push(...examModels);

    const uniqueModels = models.filter((n, i) => models.indexOf(n) === i);

    return uniqueModels;
  }

  private async findExamModels(): Promise<any> {
    const exam = await this.examModel.findOne();

    let models = exam.questions.map((question) => {
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
  ): Promise<any[]> {

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
              title: true,
            },
          },
        ])
        .exec();

    let resultQuestions = [];
    aggregationResults.forEach(result => {
      let questions = result.questions.map((question) => {
        let questionFinal = question;
        questionFinal.id = question.id.toString();
        questionFinal.planetTitle = result.title;
        return questionFinal;
      });
      resultQuestions.push(...questions);
    });

    let finalResult = resultQuestions.sort(
      (a, b) => a.id.localeCompare(b.id),
    );

    let examQuestions = await this.findAllExamQuestions(modelId);
    finalResult.push(...examQuestions);

    return finalResult;
  }

  private async findAllExamQuestions(
    modelId: string,
  ): Promise<any[]> {
    const exam = await this.examModel.findOne();

    let examQuestions = exam.questions
      .filter((question) => question.model_id == modelId)
      .map((question) => {
        let questionFinal: any = question;
        questionFinal.planetTitle = 'Prova';
        return questionFinal;
      });

    return examQuestions.sort((a, b) => a.id - b.id);
  }

  async findAllPlanetModels(
    planetIds: string[],
  ): Promise<Question[]> {

    const planets: any[] = await this.planetModel
        .find({
          id: { $in: planetIds }
        }).exec();

    let models = planets
      .reduce((question, planet) => [ ...question, ...planet.questions ], [])
      .map((question) => question.model_id);

    const uniqueModels = models.filter((n, i) => models.indexOf(n) === i);

    return uniqueModels;
  }
}
