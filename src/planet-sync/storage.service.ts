import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { InjectModel } from '@nestjs/mongoose';
import { DownloadedFile } from './schemas/download-file.schema';
import { Model } from 'mongoose';
import * as fs from 'fs-extra';
import * as mime from 'mime-types';

@Injectable()
export class StorageService {
  
  private files: any[] = [];

  constructor(
    @InjectModel(DownloadedFile.name)
    private downloadedFileModel: Model<DownloadedFile>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    
  }

  async initialize(): Promise<any> {
    const bucket = admin.storage().bucket();
    const assetsFiles = (await bucket.getFiles({ prefix: 'assets' }))[0];
    const planetsFiles = (await bucket.getFiles({ prefix: 'planets' }))[0];
    const examFiles = (await bucket.getFiles({ prefix: 'exam' }))[0];
    const studentFiles = (await bucket.getFiles({ prefix: 'student' }))[0];

    const allFiles = [
      ...assetsFiles,
      ...planetsFiles,
      ...examFiles,
      ...studentFiles,
    ];

    this.files = allFiles;
  }

  async recoverFileURL(
    id: string | null,
    url: string | null,
    bucket: string,
    fileType: string,
  ): Promise<string | null> {
    if (url === null || url === undefined || url === '') {
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
    const [fileName] = id.split('.');

    return `${fileServerUrl}/${fileName}${fileExtension}`;
  }

  private async getFileExtensionByFileName(
    bucketName: string,
    fileName: string,
  ) {
    const bucket = admin.storage().bucket();

    try {
      const file = await this.files.find((file) => file.name == `${bucketName}/${fileName}`);

      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType;

      if (contentType === 'application/x-www-form-urlencoded;charset=UTF-8')
        return;

      const extension = this.getExt(contentType);
      if (extension) return extension;
      else return '';
    } catch (error) {
      console.log(`Erro ao obter extensão do arquivo ${fileName}, no bucket ${bucketName}`);
      console.log('----------------------------------------------------------------------------');

      const extensions = ['.svg', '.mp4', '.mp3', '.png', '.json'];
      for (const ext of extensions) {
        try {
          const [metadata] = await bucket
            .file(`${bucketName}/${fileName}${ext}`)
            .getMetadata();
          const contentType = metadata.contentType;
          const extension = this.getExt(contentType);

          if (extension) return extension;
          else return '';
        } catch {}
      }
    }
  }

  async downloadFiles() {
    console.log('Planet Sync - Iniciando download dos artefatos');
    this.createDirectoryInRoot('dist/assets-data');
    const bucket = admin.storage().bucket();

    const assetsFiles = (await bucket.getFiles({ prefix: 'assets' }))[0];
    const planetsFiles = (await bucket.getFiles({ prefix: 'planets' }))[0];
    const examFiles = (await bucket.getFiles({ prefix: 'exam' }))[0];
    const studentFiles = (await bucket.getFiles({ prefix: 'student' }))[0];

    const allFiles = [
      ...assetsFiles,
      ...planetsFiles,
      ...examFiles,
      ...studentFiles,
    ];

    await this.cacheManager.set(
      'sync-total-files',
      allFiles.filter(
        (file) =>
          file.metadata.contentType !=
          'application/x-www-form-urlencoded;charset=UTF-8',
      ).length,
      0,
    );

    for (const file of allFiles) {
      if (
        file.metadata.contentType ===
        'application/x-www-form-urlencoded;charset=UTF-8'
      )
        continue;

      // const fileExt = this.getExt(file.metadata.contentType);

      const fileName =
        file.name
          .replace(/\.[^/.]+$/, '')
          .replace('assets/', '')
          .replace('planets/', '')
          .replace('exam/', '')
          .replace('student/', '');
          //  + fileExt;

      await bucket
        .file(file.name)
        .download({ destination: `dist/assets-data/${fileName}` });

      await this.downloadedFileModel.findOneAndUpdate(
        { fileName },
        { fileName },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    await this.cacheManager.set('sync-current-end', new Date(), 0);

    console.log('Planet Sync - Download dos artefatos concluído');
  }

  async getLottie(lottieId: string) {
    const rootPath = process.cwd();
    const lottiePath = `${rootPath}/dist/assets-data/${lottieId}.json`;

    if (process.env.ASSETS != 'LOCAL') {
      await this.downloadLottieFile(lottieId);
    }

    try {
      const lottie = await fs.readJson(lottiePath, { encoding: 'utf-8' });
      return JSON.stringify(lottie);
    } catch (error) {
      throw new Error(`Erro ao ler o arquivo: ${error}`);
    }
  }

  private async downloadLottieFile(lottieId: string): Promise<string> {
    await this.createDirectoryInRoot('dist/assets-data');
    const bucket = admin.storage().bucket();
    const file = bucket.file(`assets/${lottieId}`);
    await file.download({ destination: `dist/assets-data/${lottieId}.json` });
    return lottieId;
  }

  public async downloadFile(fileId: string): Promise<string> {
    await this.createDirectoryInRoot('dist/assets-data');
    const bucket = admin.storage().bucket();
    const file = bucket.file(`assets/${fileId}`);
    await file.download({ destination: `dist/assets-data/${fileId}` });
    return fileId;
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

  getExt(contentType: string) {
    const extension = mime.extension(contentType);
    if (!extension) throw new Error(`Extensão não encontrada: ${contentType}`);

    const extExceptions = [{ ext: 'mpga', replaceWith: 'mp3' }];

    return (
      '.' +
      (extExceptions.some((e) => e.ext === extension)
        ? extExceptions.find((e) => e.ext === extension)?.replaceWith
        : extension)
    );
  }
}
