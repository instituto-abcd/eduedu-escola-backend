import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { firebaseApp } from './firebase.service';

@Injectable()
export class StorageService {

  private bucketNames: string[] = [];

  constructor() {
    this.bucketNames.push('assets');
    this.bucketNames.push('planets');
    this.bucketNames.push('exam/audio');
    this.bucketNames.push('exam/image');
    this.bucketNames.push('exam/video');
  }

  async getFileExtensionByFileName(fileName: string) {
    const bucket = admin.storage().bucket();

    for (let index = 0; index < this.bucketNames.length; index++) {
      try {
        const [metadata] = await bucket.file(`${this.bucketNames[index]}/${fileName}`).getMetadata();
        const contentType = metadata.contentType;
        const extensao = contentType.split('/').pop();
        if (extensao) {
          return '.' + extensao.replace('+xml', '').replace('mpeg', 'mp3');
        } else {
          return null;
        }
      } catch (error) {
        // Do Nothing
      }
    };
  }

  async handleFile(bucketName: string, fileName: string) {
    const bucket = admin.storage().bucket();

    try {
      const [metadata] = await bucket.file(`${bucketName}/${fileName}`).getMetadata();
      const contentType = metadata.contentType;
      const fileExtension = contentType.split('/').pop();
      if (fileExtension) {
        return '.' + fileExtension.replace('+xml', '').replace('mpeg', 'mp3');
      } else {
        return null;
      }
    } catch (error) {
      // Do Nothing
    }
  }

}
