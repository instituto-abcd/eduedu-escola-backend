import axios from 'axios';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { IExam } from 'src/exam/schemas/exam.schema';

const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ||
  'https://api-os-gateway-kwlh7mypza-rj.a.run.app';

const apiGatewayClient = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'x-assets-access-key': process.env.CLIENT_KEY || 'HEEL-OWOR-LDDF-XXXX',
  },
});

export const ApiGatewayService = {
  async getPlanets(): Promise<Array<PlanetOrigin>> {
    const response = await apiGatewayClient.get('/planets/all');
    return response?.data?.planets;
  },
  async getTotalPlanetsCount(): Promise<number> {
    const response = await apiGatewayClient.get('/planets/count');
    return response?.data?.count;
  },
  async getPlanet(planetId: string): Promise<PlanetOrigin> {
    const response = await apiGatewayClient.get(`/planets/${planetId}`);
    return response?.data?.planet;
  },
  async getExams(): Promise<IExam[]> {
    const response = await apiGatewayClient.get('/exams');
    return response?.data?.exams;
  },
  async getAssets(): Promise<any> {
    const response = await apiGatewayClient.get(
      '/assets?installId=INSTALL_ID',
      {
        responseType: 'stream',
      },
    );
    return response;
  },
};
