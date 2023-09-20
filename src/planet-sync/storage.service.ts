import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FtpService } from 'src/ftp/ftp.service';

@Injectable()
export class StorageService {

  private bucketNames: string[] = [];

  constructor(
    private readonly ftpService: FtpService,
  ) {
    this.bucketNames.push('assets');
    this.bucketNames.push('planets');
    this.bucketNames.push('exam/audio');
    this.bucketNames.push('exam/image');
    this.bucketNames.push('exam/video');
  }

  async handleFile(bucketName: string, fileName: string) {
    const bucket = admin.storage().bucket();

    try {
      const file = await bucket.file(`${bucketName}/${fileName.toLowerCase()}`);
      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType;
      const extension = contentType.split('/').pop();
      if (extension) {
        let fileExtension = '.' + extension.replace('+xml', '').replace('mpeg', 'mp3')
        const fullFileName = fileName.toLowerCase().replace('.mp3','').replace('.mp4','').replace('.svg','') + fileExtension;

        await this.ftpService.uploadFileStream(file.createReadStream(), fullFileName);

        return fileExtension;
      } else {
        return null;
      }
    } catch (error) {
      // Do Nothing
    }
  }

  async downloadFiles() {
    let bucketNames = [
      'assets',
      'planets',
      'exam',
      'student',
    ];

    let start = new Date();

    for (let index = 0; index < bucketNames.length; index++) {
      let bucketName = bucketNames[index];
      const bucket = admin.storage().bucket();

      let files = (await bucket.getFiles({prefix: bucketName}))[0];

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const extension = files[fileIndex].metadata.contentType.split('/').pop();
        let fileExtension = '.' + extension.replace('+xml', '').replace('mpeg', 'mp3')
        
        let fileName = files[fileIndex].name
          .replace(`${bucketName}/`, '')
          .replace('.mp3','').replace('.mp4','').replace('.svg','') + `${fileExtension}`;

        await this.ftpService.uploadFileStream(files[fileIndex].createReadStream(), fileName);

        console.log(fileName);
      }
    }

    let finish = new Date();

    console.log('----------------------------');
    console.log('----------------------------');
    console.log('Tempo Total: ' + this.convertMsToTime(finish.getTime() - start.getTime()));
    console.log('----------------------------');
    console.log('----------------------------');
  }

  private padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
  }
  
  private convertMsToTime(milliseconds: number) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
  
    seconds = seconds % 60;
    minutes = minutes % 60;
  
    return `${this.padTo2Digits(hours)}:${this.padTo2Digits(minutes)}:${this.padTo2Digits(
      seconds,
    )}`;
  }

}
