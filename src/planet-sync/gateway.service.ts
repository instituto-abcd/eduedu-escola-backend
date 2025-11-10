import { Injectable } from '@nestjs/common';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { IExam } from '../exam/schemas/exam.schema';
import { ApiGatewayService } from './apiGateway.service';

@Injectable()
export class GatewayService {
  async getPlanets(accessKey: string): Promise<Array<PlanetOrigin>> {
    const docs: PlanetOrigin[] = await ApiGatewayService.getPlanets(accessKey);

    console.log('Planets fetched from Firestore:', docs.length);

    return docs;
  }

  async getTotalPlanetsCount(accessKey: string): Promise<number> {
    const planetsCount: number = await ApiGatewayService.getTotalPlanetsCount(
      accessKey,
    );
    return planetsCount;
  }

  async getPlanet(planetId: string, accessKey: string): Promise<PlanetOrigin> {
    const doc: PlanetOrigin = await ApiGatewayService.getPlanet(
      planetId,
      accessKey,
    );
    return doc;
  }

  async getExams(accessKey: string): Promise<IExam[]> {
    const exams: IExam[] = await ApiGatewayService.getExams(accessKey);
    return exams;
  }
}
