import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { firebaseApp } from './firebase.service';

@Injectable()
export class StorageService {
  private storage: admin.storage.Storage;

  private bucketNames: string[] = [];

  constructor() {
    this.storage = firebaseApp.storage();

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

}
