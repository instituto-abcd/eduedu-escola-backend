import axios, { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DateApiService {
  async getCurrentYear(): Promise<number> {
    try {
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
    } catch (error) {
      // Em caso de erro, recupere a data local
      return new Date().getFullYear();
    }
  }

  async getCurrentTime(): Promise<Date> {
    try {
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
    } catch (error) {
      // Em caso de erro, recupere a data local
      return new Date();
    }
  }
}
