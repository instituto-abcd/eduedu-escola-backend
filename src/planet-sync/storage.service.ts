import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FtpService } from 'src/ftp/ftp.service';
import { InjectModel } from '@nestjs/mongoose';
import { DownloadedFile } from './schemas/download-file.schema';
import { Model } from 'mongoose';

@Injectable()
export class StorageService {

  private bucketNames: string[] = [];

  constructor(
    private readonly ftpService: FtpService,
    @InjectModel(DownloadedFile.name) private downloadedFileModel: Model<DownloadedFile>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.bucketNames.push('assets');
    this.bucketNames.push('planets');
    this.bucketNames.push('exam/audio');
    this.bucketNames.push('exam/image');
    this.bucketNames.push('exam/video');
  }

  async recoverFileURL(
    id: string | null,
    url: string | null,
    bucket: string,
    fileType: string,
  ): Promise<string | null> {
    if (url === null || url === undefined || url == '') {
      return '';
    }

    if (process.env.ASSETS !== 'LOCAL') {
      return url;
    }

    let fileExtension;
    switch (fileType) {
      case 'image':
        fileExtension = '.svg';
        break;
      case 'sound':
        fileExtension = '.mp3';
        break;
      default:
        fileExtension = await this.getFileExtensionByFileName(bucket, id);
        break;
    }

    const fileServerUrl = process.env.FILE_SERVER_URL;
    return `${fileServerUrl}/${id}${fileExtension}`;
  }

  private async getFileExtensionByFileName(bucketName: string, fileName: string) {
    const bucket = admin.storage().bucket();
    try {
      const [metadata] = await bucket.file(`${bucketName}/${fileName}`).getMetadata();
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

  async getSyncedFilesCount(): Promise<number> {
    return this.ftpService.countFilesInDirectory('/');
  }

  async downloadFiles() {
    let bucketNames = [
      'assets',
      'planets',
      'exam',
      'student',
    ];

    const bucket = admin.storage().bucket();

    let assetsFiles = (await bucket.getFiles({prefix: 'assets'}))[0];
    let planetsFiles = (await bucket.getFiles({prefix: 'planets'}))[0];
    let examFiles = (await bucket.getFiles({prefix: 'exam'}))[0];
    let studentFiles = (await bucket.getFiles({prefix: 'student'}))[0];

    let allFiles = [];
    allFiles.push(...assetsFiles);
    allFiles.push(...planetsFiles);
    allFiles.push(...examFiles);
    allFiles.push(...studentFiles);

    await this.cacheManager.set('sync-total-files', allFiles.length, 0);

    for (let fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
      const extension = allFiles[fileIndex].metadata.contentType.split('/').pop();
      let fileExtension = '.' + extension.replace('+xml', '').replace('mpeg', 'mp3')
      
      let fileName = allFiles[fileIndex].name
        .replace('assets/', '')
        .replace('planets/', '')
        .replace('exam/', '')
        .replace('student/', '')
        .replace('.mp3','').replace('.mp4','').replace('.svg','') + `${fileExtension}`;
      
      try {
        await promiseRetry(() => this.ftpService.uploadFileStream(allFiles[fileIndex].createReadStream(), fileName));

        await this.downloadedFileModel.findOneAndUpdate(
          { fileName },
          { fileName },
          { upsert: true, new: true, setDefaultsOnInsert: true });
      } catch (error) { }
      
    }

    await this.cacheManager.set('sync-current-end', new Date(), 0);

  }

}

export async function promiseRetry<T>(fn: () => Promise<T>, retries = 5, err?: any): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, (5 - retries) * 1000));

  return !retries ? Promise.reject(err) : fn().catch(error => promiseRetry(fn, (retries - 1), error));
}