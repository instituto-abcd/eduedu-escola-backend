import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DownloadedFile } from './schemas/download-file.schema';
import { Model } from 'mongoose';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as unzipper from 'unzipper';
import * as mime from 'mime-types';
import { ApiGatewayService } from './apiGateway.service';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

type StoredFile = { name: string; mimeType: string; extension: string };

@Injectable()
export class StorageService {
  private files: StoredFile[] = [];
  private readonly assetsDir: string;

  constructor(
    @InjectModel(DownloadedFile.name)
    private downloadedFileModel: Model<DownloadedFile>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.assetsDir = path.resolve(__dirname, '../../assets-data');

    if (!fs.existsSync(this.assetsDir)) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
      this.files = [];
    } else {
      this.reloadFiles();
    }
  }

  private reloadFiles() {
    this.files = fs
      .readdirSync(this.assetsDir)
      .filter((file) => fs.statSync(path.join(this.assetsDir, file)).isFile())
      .map((file) => {
        const mimeType = mime.lookup(file) || 'application/octet-stream';

        const extension = (path.extname(file) || '').replace(/^\./, '');
        return {
          name: path.parse(file).name,
          mimeType,
          extension,
        } as StoredFile;
      });
  }

  getFiles(): StoredFile[] {
    return this.files;
  }

  async recoverFileURL(fileId?: string): Promise<string | null> {
    if (!fileId) {
      return null;
    }

    const fileExtension = await this.getFileExtensionByFileId(fileId);
    if (!fileExtension) {
      // console.log(`Extensão não encontrada para fileId=${fileId}`);
      return null;
    }

    const fileIdArray = fileId.split('.');

    const fileServerUrl = process.env.FILE_SERVER_URL || '';

    // Previne extensões de arquivo duplas, como .tar.gz ou mp3.mp3

    console.log({ fileId, fileExtension, fileIdArray });
    const url =
      fileIdArray.length > 1
        ? `${fileServerUrl}/${fileIdArray[0]}.${fileExtension}`
        : `${fileServerUrl}/${fileId}.${fileExtension}`;
    return url;
  }

  private async getFileExtensionByFileId(
    fileId: string,
  ): Promise<string | null> {
    if (!fileId) return null;

    const normalizedId = path
      .parse(fileId)
      .name.trim()
      .toLowerCase()
      .replace(/^\./, '');

    const file = this.files.find(
      (f) => f.name.trim().toLowerCase() === normalizedId,
    );

    if (!file) {
      // console.log(`[!] Extensão não encontrada para fileId=${fileId}`);
      return null;
    }

    return file.extension;
  }

  async downloadFiles(accessKey: string) {
    try {
      console.log('Iniciando download dos artefatos');

      await this.cacheManager.set('sync-running', true, 0);
      await this.cacheManager.set(
        'sync-current-operation',
        'Limpando pasta de assets...',
        0,
      );
      await this.cacheManager.set('sync-synced-files', 0, 0);

      console.log('[DOWNLOAD] - Limpando pasta de assets...');
      await fs.emptyDir(this.assetsDir);
      console.log('[DOWNLOAD] - Pasta limpa.');

      await this.downloadedFileModel.deleteMany();

      await this.cacheManager.set(
        'sync-current-operation',
        'Baixando ZIP de assets...',
        0,
      );
      await this.downloadZipAssets(accessKey);

      await this.cacheManager.set(
        'sync-current-operation',
        'Extraindo arquivos...',
        0,
      );
      const filesLength = await this.extrairZip();

      await this.cacheManager.set('sync-total-files', filesLength, 0);
      await this.cacheManager.set(
        'sync-current-operation',
        'Baixando Metadados',
        0,
      );

      console.log('Download dos artefatos concluído');
      await this.cacheManager.set('sync-running', false, 0);
    } catch (error) {
      console.error('Erro no download dos artefatos:', error);
      await this.cacheManager.set('sync-running', false, 0);
      throw error;
    }
  }

  async downloadZipAssets(accessKey: string): Promise<void> {
    console.log('Iniciando download do zip de assets...');

    const outputFile = path.join(this.assetsDir, 'assets.zip');
    await fs.ensureDir(this.assetsDir);

    try {
      const assetsResponse = await ApiGatewayService.getAssets(accessKey);

      const totalLength = Number(assetsResponse.headers['content-length']) || 0;

      let downloaded = 0;
      const progress = new Transform({
        transform: async (chunk, _encoding, callback) => {
          downloaded += chunk.length;
          if (totalLength) {
            const percent = ((downloaded / totalLength) * 100).toFixed(2);
            await this.cacheManager.set(
              'sync-current-operation',
              `Baixando ZIP (${percent}%)`,
              0,
            );
          }
          callback(null, chunk);
        },
      });

      await pipeline(
        assetsResponse.data,
        progress,
        fs.createWriteStream(outputFile),
      );

      console.log('\nZIP baixado com sucesso!');
    } catch (err) {
      await this.cacheManager.set(
        'sync-current-operation',
        'Erro no download do ZIP',
        0,
      );
      throw new Error('Erro ao baixar o arquivo ZIP de assets ');
    }
  }

  async extrairZip(): Promise<number> {
    const zipPath = path.join(this.assetsDir, 'assets.zip');
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Arquivo ZIP não encontrado: ${zipPath}`);
    }

    console.log('Descompactando ZIP...');
    const zipFiles = await unzipper.Open.file(zipPath);
    const total = zipFiles.files.length;
    let processed = 0;

    await this.cacheManager.set('sync-total-files', total, 0);
    await this.cacheManager.set('sync-synced-files', 0, 0);

    for (const entry of zipFiles.files) {
      const fileName = entry.path;
      const outputPath = path.join(this.assetsDir, fileName);
      const outputDir = path.dirname(outputPath);
      await fs.ensureDir(outputDir);

      await this.downloadedFileModel.findOneAndUpdate(
        { fileName },
        { fileName },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      await new Promise<void>((resolve, reject) => {
        entry
          .stream()
          .pipe(fs.createWriteStream(outputPath))
          .on('finish', resolve)
          .on('error', reject);
      });

      processed++;
      if (processed % 10 === 0 || processed === total) {
        const percent = ((processed / total) * 100).toFixed(2);
        await this.cacheManager.set('sync-synced-files', processed, 0);
        await this.cacheManager.set(
          'sync-current-operation',
          `Extraindo arquivos (${percent}%)`,
          0,
        );
      }
    }

    this.reloadFiles();

    console.log('Descompactação concluída!');
    return total;
  }

  async getLottie(lottieId: string) {
    const lottiePath = path.join(this.assetsDir, `${lottieId}.json`);

    try {
      const lottie = await fs.readJson(lottiePath, { encoding: 'utf-8' });
      return JSON.stringify(lottie);
    } catch (error) {
      throw new Error(`Erro ao ler o arquivo Lottie (${lottiePath}): ${error}`);
    }
  }
}
