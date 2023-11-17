import { Inject, Injectable } from '@nestjs/common';
import { PlanetDto } from './dto/planet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Planet,
  PlanetDocument,
  Question,
} from 'src/planet-sync/schemas/planet.schema';
import { Exam, ExamDocument } from 'src/exam/schemas/exam.schema';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { StudentService } from '../student/student.service';
// import { Cache } from 'cache-manager';

@Injectable()
export class PlanetService {
  constructor(
    @InjectModel(Planet.name)
    private planetModel: Model<PlanetDocument>,
    @InjectModel(Exam.name)
    private examModel: Model<ExamDocument>,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly studentService: StudentService,
  ) {}

  async findAll(): Promise<PlanetDto[]> {
    const planets = await this.planetModel.find();
    return planets;
  }

  async findPlanetModels(): Promise<any> {
    // const planets = await this.planetModel.find();
    // const questions = planets.reduce((question, planet) => [ ...question, ...planet.questions ], []);

    // let models = questions.map((question) => {
    //   return question.model_id
    // });

    const models = [
      'MODEL2',
      'MODEL3',
      'MODEL4',
      'MODEL5',
      'MODEL8',
      'MODEL10',
      'MODEL11',
      'MODEL12',
      'MODEL13',
      'MODEL14',
      'MODEL15',
      'MODEL16',
      'MODEL18',
      'MODEL19',
      'MODEL20',
      'MODEL21',
      'MODEL22',
      'MODEL24',
      'MODEL25',
      'MODEL26',
      'MODEL27',
      'MODEL28',
      'MODEL29',
      'MODEL30',
      'MODEL31',
      'MODEL32',
      'MODEL33',
      'MODEL34',
      'MODEL35',
      'MODEL10-PROVA',
      'MODEL11-PROVA',
      'MODEL18-PROVA',
      'MODEL2-VIDEO',
      'MODEL8-PROVA',
      'QME2x2Audio',
      'QME2x2Text',
      'QME2x2Video',
      'QMES2x3Video',
      'QMES5',
      'QORD3x2',
    ];

    return models.sort((a, b) => a.localeCompare(b));

    // let examModels = await this.findExamModels();
    // models.push(...examModels);

    // const uniqueModels = models.filter((n, i) => models.indexOf(n) === i);

    // return uniqueModels.sort(
    //   (a, b) => a.localeCompare(b),
    // );
  }

  private async findExamModels(): Promise<any> {
    const exam = await this.examModel.findOne();

    const models = exam.questions.map((question) => {
      return question.model_id;
    });

    const uniqueModels = models.filter((n, i) => models.indexOf(n) === i);

    return uniqueModels;
  }

  async assignAllPlanetsToUser(studentId: string): Promise<any> {
    try {
      const planets = await this.planetModel.find();
      await this.studentService.generateAndSavePlanetTrack(studentId, planets);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
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

  // async resetAllPlanetQuestionsCache() {
  //   const models = await this.findPlanetModels();
  //
  //   for (let index = 0; index < models.length; index++) {
  //     const modelId = models[index];
  //     await this.cacheManager.del(`DEBUG_QUESTIONS_${modelId}`);
  //   }
  // }

  // async findAllPlanetQuestions(modelId: string): Promise<any[]> {
  //   let finalResult = await this.cacheManager.get<any[]>(
  //     `DEBUG_QUESTIONS_${modelId}`,
  //   );
  //
  //   if (!finalResult) {
  //     const aggregationResults: any[] = await this.planetModel
  //       .aggregate([
  //         {
  //           $match: { 'questions.model_id': modelId },
  //         },
  //         {
  //           $project: {
  //             questions: {
  //               $filter: {
  //                 input: '$questions',
  //                 as: 'question',
  //                 cond: { $eq: ['$$question.model_id', modelId] },
  //               },
  //             },
  //             title: true,
  //           },
  //         },
  //       ])
  //       .exec();
  //
  //     const resultQuestions = [];
  //     aggregationResults.forEach((result) => {
  //       const questions = result.questions.map((question) => {
  //         const questionFinal = question;
  //         questionFinal.id = question.id.toString();
  //         questionFinal.planetTitle = result.title;
  //         return questionFinal;
  //       });
  //       resultQuestions.push(...questions);
  //     });
  //
  //     finalResult = resultQuestions.sort((a, b) => a.id.localeCompare(b.id));
  //
  //     const examQuestions = await this.findAllExamQuestions(modelId);
  //     finalResult.push(...examQuestions);
  //
  //     await this.cacheManager.set(`DEBUG_QUESTIONS_${modelId}`, finalResult, 0);
  //   }
  //
  //   return finalResult;
  // }

  async findAllPlanetQuestionsTest(modelId: string): Promise<any[]> {
    let finalResult = [];

    const aggregationResults: any[] = await this.planetModel
      .aggregate([
        {
          // $match: { 'questions.model_id': modelId },
          $match: { 'questions.orderedAnswer': true },
        },
        {
          $project: {
            questions: {
              $filter: {
                input: '$questions',
                as: 'question',
                // cond: { $eq: ['$$question.model_id', modelId] },
                cond: { $eq: ['$$question.model_id', true] },
              },
            },
            title: true,
          },
        },
      ])
      .exec();

    const resultQuestions = [];
    aggregationResults.forEach((result) => {
      const questions = result.questions.map((question) => {
        const questionFinal = question;
        questionFinal.id = question.id.toString();
        questionFinal.planetTitle = result.title;
        return questionFinal;
      });
      resultQuestions.push(...questions);
    });

    finalResult = resultQuestions
      .filter(
        (item) =>
          item.orderedAnswer == true &&
          item.options.some((option) => option.isCorrect == false),
      )
      .sort((a, b) => a.id.localeCompare(b.id));

    return finalResult;
  }

  private async findAllExamQuestions(modelId: string): Promise<any[]> {
    const exam = await this.examModel.findOne();

    const examQuestions = exam.questions
      .filter((question) => question.model_id == modelId)
      .map((question) => {
        const questionFinal: any = question;
        questionFinal.planetTitle = 'Prova';
        return questionFinal;
      });

    return examQuestions.sort((a, b) => a.id - b.id);
  }

  async findAllPlanetModels(planetIds: string[]): Promise<Question[]> {
    const planets: any[] = await this.planetModel
      .find({
        id: { $in: planetIds },
      })
      .exec();

    const models = planets
      .reduce((question, planet) => [...question, ...planet.questions], [])
      .map((question) => question.model_id);

    const uniqueModels = models.filter((n, i) => models.indexOf(n) === i);

    return uniqueModels;
  }
}
