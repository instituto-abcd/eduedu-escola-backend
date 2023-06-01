import axios, { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalApiService {
  async getCurrentDateTime(): Promise<number> {
    const response: AxiosResponse<any> = await axios.get(
      'https://www.timeapi.io/api/Time/current/zone',
      {
        params: {
          timeZone: 'America/Sao_Paulo',
        },
        headers: {
          Accept: 'application/json',
        },
      },
    );

    return response.data.year;
  }
}