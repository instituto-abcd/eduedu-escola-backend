import { Injectable } from '@nestjs/common';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { IExam } from '../exam/schemas/exam.schema';
import { ApiGatewayService } from './apiGateway.service';

@Injectable()
export class GatewayService {

  /**
   * 
   * @param accessKey Chave para validação
   * @returns Status da resposta de validação (200 = válida)
   * @throws Em caso de chave inválida, um erro 4xx em caso de chave inválida ou 5xx em caso de erro na api
   */
  async validateKey(accessKey: string): Promise<number> {
    console.log('Validating access key with API Gateway...');
    const validationStatusCode: number = await ApiGatewayService.validateKey(
      accessKey,
    );
    return validationStatusCode;
  }

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
