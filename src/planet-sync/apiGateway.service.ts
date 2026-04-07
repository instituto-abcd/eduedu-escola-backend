import axios from 'axios';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { IExam } from 'src/exam/schemas/exam.schema';

const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ||
  'https://api-os-gateway-kwlh7mypza-rj.a.run.app';

const apiGatewayClient = axios.create({
  baseURL: API_GATEWAY_URL,
});

export const ApiGatewayService = {
  async validateKey(accessKey: string): Promise<number> {
    const response = await apiGatewayClient.get('/key/validate', {
      headers: {
        'x-assets-access-key': accessKey,
      },
    });
    return response?.status;
  },
  async getPlanets(accessKey: string): Promise<Array<PlanetOrigin>> {
    const response = await apiGatewayClient.get('/planet', {
      headers: {
        'x-assets-access-key': accessKey,
      },
    });
    return response?.data?.planets;
  },
  async getTotalPlanetsCount(accessKey: string): Promise<number> {
    const response = await apiGatewayClient.get('/planet/count', {
      headers: {
        'x-assets-access-key': accessKey,
      },
    });
    return response?.data?.count;
  },
  async getPlanet(planetId: string, accessKey: string): Promise<PlanetOrigin> {
    const response = await apiGatewayClient.get(`/planet/${planetId}`, {
      headers: {
        'x-assets-access-key': accessKey,
      },
    });
    return response?.data?.planet;
  },
  async getExams(): Promise<IExam[]> {
    const response = await apiGatewayClient.get('/exam');
    return response?.data?.exams;
  },
  async getPlanetAssets(accessKey: string): Promise<any> {
    const response = await apiGatewayClient.get(
      '/asset/planet?installId=INSTALL_ID',
      {
        responseType: 'stream',
        headers: {
          'x-assets-access-key': accessKey,
        },
      },
    );
    return response;
  },
  async getExamAssets(): Promise<any> {
    const response = await apiGatewayClient.get(
      '/asset/exam?installId=INSTALL_ID',
      {
        responseType: 'stream',
      },
    );
    return response;
  },
};
