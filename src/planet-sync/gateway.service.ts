import { Injectable } from '@nestjs/common';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { IExam } from '../exam/schemas/exam.schema';
import { ApiGatewayService } from './apiGateway.service';

@Injectable()
export class GatewayService {
  async getPlanets(): Promise<Array<PlanetOrigin>> {
    const docs: PlanetOrigin[] = await ApiGatewayService.getPlanets();

    console.log('Planets fetched from Firestore:', docs.length);

    return docs;
  }

  async getTotalPlanetsCount(): Promise<number> {
    const planetsCount: number = await ApiGatewayService.getTotalPlanetsCount();
    return planetsCount;
  }

  async getPlanet(planetId: string): Promise<PlanetOrigin> {
    const doc: PlanetOrigin = await ApiGatewayService.getPlanet(planetId);
    return doc;
  }

  async getExams(): Promise<IExam[]> {
    const exams: IExam[] = await ApiGatewayService.getExams();
    return exams;
  }
}
