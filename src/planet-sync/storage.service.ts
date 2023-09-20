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

}
