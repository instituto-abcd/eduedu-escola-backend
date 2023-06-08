import axios, { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DateApiService {
  async getCurrentYear(): Promise<number> {
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

  async getCurrentTime(): Promise<Date> {
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

    const dateTimeString: string = response.data.dateTime;
    return new Date(dateTimeString);
  }
}
