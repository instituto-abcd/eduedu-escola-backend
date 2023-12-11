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
  ): Promise<string | null> {
    if (process.env.ASSETS !== 'LOCAL') {
      return url;
    }

    let fileExtension = await this.getFileExtensionByFileName(bucket, id);

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

      const extension = await this.getExt(file);
      if (extension) return extension;
      else return '';
    } catch (error) {
      console.log(`Erro ao obter extensão do arquivo ${fileName}, no bucket ${bucketName}`);
      console.log('Efetuando tentativa alternativa...');
      
      const extensions = ['.svg', '.mp4', '.mp3', '.png', '.json'];
      for (const ext of extensions) {
        try {
          const file = await this.files.find((file) => file.name == `${bucketName}/${fileName}/${ext}`);
          const extension = await this.getExt(file);

          if (extension) {
            console.log('Tudo Ok');
            console.log('----------------------------------------------------------------------------');
            return extension;
          } else {
            console.log('Não deu =/');
            console.log('----------------------------------------------------------------------------');
            return '';
          }
        } catch {}
      }
    }
  }

  async downloadFiles() {
    await this.downloadedFileModel.deleteMany();

    console.log('Planet Sync - Iniciando download dos artefatos');
    this.createDirectoryInRoot('dist/assets-data');
    const bucket = admin.storage().bucket();

    const assetsFiles = (await bucket.getFiles({ prefix: 'assets' }))[0];
    const planetsFiles = (await bucket.getFiles({ prefix: 'planets' }))[0];
    const examFiles = (await bucket.getFiles({ prefix: 'exam' }))[0];
    const studentFiles = (await bucket.getFiles({ prefix: 'student' }))[0];

    let allFiles = [
      ...assetsFiles,
      ...planetsFiles,
      ...examFiles,
      ...studentFiles,
    ];

    allFiles = allFiles.filter(
      (file) =>
        file.metadata.contentType !=
        'application/x-www-form-urlencoded;charset=UTF-8',
    );

    await this.cacheManager.set(
      'sync-total-files',
      allFiles.length,
      0,
    );

    for (const file of allFiles) {
      try {
        await this.downloadSingleFile(file);
      } catch (error) {
        console.log(file.name);
        console.log(error);
      }
    }

    await this.cacheManager.set('sync-current-operation', 'Baixando Metadados', 0);
    console.log('Planet Sync - Download dos artefatos concluído');
  }

  async downloadSingleFile(file: any): Promise<boolean> {
    const bucket = admin.storage().bucket();
    const fileExt = await this.getExt(file);

    const fileName =
      file.name
        .replace(/\.[^/.]+$/, '')
        .replace('assets/', '')
        .replace('planets/', '')
        .replace('exam/', '')
        .replace('student/', '') + fileExt;

    await bucket
      .file(file.name)
      .download({ destination: `dist/assets-data/${fileName}` });

    await this.downloadedFileModel.findOneAndUpdate(
      { fileName },
      { fileName },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return true;
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

  public async downloadFile(fileId: string, bucketName: string): Promise<string> {
    await this.createDirectoryInRoot('dist/assets-data');
    const bucket = admin.storage().bucket();
    const file = bucket.file(`${bucketName}/${fileId}`);
    await this.downloadSingleFile(file);
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

  async getExt(file: any) {

    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType;

    const extension = mime.extension(contentType);
    if (!extension) {
      console.log(`Extensão não encontrada: Arquivo ${file.name}`);
      throw new Error(`Extensão não encontrada: Arquivo ${file.name}`);
    }

    const extExceptions = [{ ext: 'mpga', replaceWith: 'mp3' }];

    return (
      '.' +
      (extExceptions.some((e) => e.ext === extension)
        ? extExceptions.find((e) => e.ext === extension)?.replaceWith
        : extension)
    );
  }
}
