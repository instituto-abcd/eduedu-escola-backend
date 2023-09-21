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
      password: process.env.FTP_PASS,
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

  async listFilesInDirectory(directoryPath: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const client = new ftp();

      const ftpConfig = {
        host: process.env.FTP_SERVER_URL,
        port: 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASS,
      };

      client.on('ready', () => {
        client.list(directoryPath, (err, files) => {
          client.end();

          if (err) {
            reject(err);
          } else {
            const fileNames = files.map((file) => file.name);
            client.end();
            resolve(fileNames);
          }
        });
      });

      client.on('error', (err) => {
        client.end();
        reject(err);
      });

      client.connect(ftpConfig);
    });
  }

  async countFilesInDirectory(directoryPath: string): Promise<number> {
    const fileNames = await this.listFilesInDirectory(directoryPath);
    return fileNames.length;
  }
}
