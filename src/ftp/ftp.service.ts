import { Injectable } from '@nestjs/common';
import * as ftp from 'ftp';

@Injectable()
export class FtpService {
  constructor() {}

  async uploadFileStream(fileStream: any, remoteFilePath: string): Promise<void> {
    const client = new ftp();

    const ftpConfig = {
      host: process.env.FTP_SERVER_URL,
      port: 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
    };

    return new Promise<void>((resolve, reject) => {
      client.on('ready', () => {
        client.put(fileStream, remoteFilePath, (err) => {
          client.end();

          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      client.on('error', (err) => {
        reject(err);
      });

      client.connect(ftpConfig);
    });
  }
}
