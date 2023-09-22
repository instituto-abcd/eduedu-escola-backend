import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { InjectModel } from '@nestjs/mongoose';
import { DownloadedFile } from './schemas/download-file.schema';
import { Model } from 'mongoose';
import * as fs from 'fs-extra';

@Injectable()
export class StorageService {

  constructor(
    @InjectModel(DownloadedFile.name) private downloadedFileModel: Model<DownloadedFile>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

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
    return `${fileServerUrl}/${id.replace('.mp3','').replace('.mp4','').replace('.svg','')}${fileExtension}`;
  }

  private async getFileExtensionByFileName(bucketName: string, fileName: string) {
    fileName = fileName.toLowerCase();
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
      const extensions = [ '.svg', '.mp4', '.mp3' ];
      for (let index = 0; index < extensions.length; index++) {
        try {
          const extension = extensions[index];
          const [metadata] = await bucket.file(`${bucketName}/${fileName}${extension}`).getMetadata();
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
    }
  }

  async downloadFiles() {
    console.log('Planet Sync - Iniciando download dos artefatos');
    this.createDirectoryInRoot('dist/assets-data');
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

      try {
        const extension = allFiles[fileIndex].metadata.contentType.split('/').pop();
        let fileExtension = '.' + extension.replace('+xml', '').replace('mpeg', 'mp3')
        
        let fileName = allFiles[fileIndex].name
          .replace('assets/', '')
          .replace('planets/', '')
          .replace('exam/', '')
          .replace('student/', '')
          .replace('.mp3','').replace('.mp4','').replace('.svg','') + `${fileExtension}`;

        await bucket.file(allFiles[fileIndex].name).download({ destination: `dist/assets-data/${fileName}` });

        await this.downloadedFileModel.findOneAndUpdate(
          { fileName },
          { fileName },
          { upsert: true, new: true, setDefaultsOnInsert: true });

      } catch (error) {
        console.log(error);  
      }
    }

    await this.cacheManager.set('sync-current-end', new Date(), 0);

    console.log('Planet Sync - Download dos artefatos concluído');

  }

  async createDirectoryInRoot(directoryName: string): Promise<void> {
    const rootPath = process.cwd();
    const directoryPath = `${rootPath}/${directoryName}`;

    try {
      await fs.ensureDir(directoryPath);
      console.log(`Diretório '${directoryName}' criado em ${directoryPath}`);
    } catch (error) {
      throw new Error(`Erro ao criar o diretório: ${error}`);
    }
  }

}