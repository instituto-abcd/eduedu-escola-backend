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
import { RequestContext } from '../common/request-context';

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

  // Remove apenas os arquivos da raiz de assets-data, preservando
  // subdiretórios. O store de provas vive em assets-data/exam e um
  // emptyDir aqui apagaria os assets de prova junto.
  private async clearAssetFiles() {
    await fs.ensureDir(this.assetsDir);

    const entries = await fs.readdir(this.assetsDir);
    for (const entry of entries) {
      const entryPath = path.join(this.assetsDir, entry);
      if ((await fs.stat(entryPath)).isFile()) {
        await fs.remove(entryPath);
      }
    }
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

    // Em contexto HTTP a URL é montada a partir do host da própria requisição,
    // para que clientes em outros dispositivos da rede consigam alcançá-la
    // mesmo quando o IP da máquina muda. FILE_SERVER_URL é só o fallback
    // fora de requisições (ex.: jobs do Bull).
    const requestBaseUrl = RequestContext.baseUrl();
    const fileServerUrl = requestBaseUrl
      ? `${requestBaseUrl}/assets-data`
      : process.env.FILE_SERVER_URL || '';

    // Previne extensões de arquivo duplas, como .tar.gz ou mp3.mp3

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

  async downloadPlanetFiles(accessKey: string) {
    try {
      console.log('Iniciando download dos artefatos de planetas');
      await this.cacheManager.set('planet-sync-running', true, 0);
      await this.cacheManager.set('planet-sync-synced-files', 0, 0);

      await this.cacheManager.set(
        'planet-sync-current-operation',
        'Limpando pasta...',
        0,
      );
      await this.clearAssetFiles();
      await this.downloadedFileModel.deleteMany();

      // 🔹 Etapa 1: Download ZIP
      await this.cacheManager.set(
        'planet-sync-current-operation',
        'Baixando ZIP de planetas...',
        0,
      );
      await this.downloadPlanetZipAssets(accessKey);

      // 🔹 Etapa 2: Extração
      await this.cacheManager.set(
        'planet-sync-current-operation',
        'Extraindo arquivos de planetas...',
        0,
      );
      const filesLength = await this.extrairZip();

      await this.cacheManager.set('planet-sync-total-files', filesLength, 0);
      console.log('Download e extração de planetas concluídos.');

      await this.cacheManager.set('planet-sync-running', false, 0);
    } catch (error) {
      console.error('Erro no download dos artefatos de planetas:', error);
      await this.cacheManager.set('planet-sync-running', false, 0);
      throw error;
    }
  }

  async downloadPlanetZipAssets(accessKey: string): Promise<void> {
    console.log('Iniciando download do zip de assets...');
    const outputFile = path.join(this.assetsDir, 'assets.zip');
    await fs.ensureDir(this.assetsDir);

    try {
      const assetsResponse = await ApiGatewayService.getPlanetAssets(accessKey);
      const totalLength = Number(assetsResponse.headers['content-length']) || 0;

      let downloaded = 0;
      const progress = new Transform({
        transform: async (chunk, _encoding, callback) => {
          downloaded += chunk.length;
          if (totalLength) {
            const percent = ((downloaded / totalLength) * 100).toFixed(2);
            const globalPercent = ((+percent / 100) * 30).toFixed(2); // 30% da etapa total
            await this.cacheManager.set(
              'planet-sync-current-operation',
              `Baixando ZIP de planetas (${percent}%)`,
              0,
            );
            await this.cacheManager.set(
              'planet-sync-global-progress',
              +globalPercent,
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
      console.log('ZIP de planetas baixado com sucesso!');
    } catch (err) {
      await this.cacheManager.set(
        'planet-sync-current-operation',
        'Erro no download do ZIP de planetas',
        0,
      );
      throw new Error('Erro ao baixar o arquivo ZIP de assets de planetas');
    }
  }

  async extrairZip(): Promise<number> {
    const zipPath = path.join(this.assetsDir, 'assets.zip');
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Arquivo ZIP não encontrado: ${zipPath}`);
    }

    console.log('Descompactando ZIP de planetas...');
    const zipFiles = await unzipper.Open.file(zipPath);
    const total = zipFiles.files.length;
    let processed = 0;

    await this.cacheManager.set('planet-sync-total-files', total, 0);
    await this.cacheManager.set('planet-sync-synced-files', 0, 0);

    for (const entry of zipFiles.files) {
      const fileName = entry.path;
      const outputPath = path.join(this.assetsDir, fileName);
      await fs.ensureDir(path.dirname(outputPath));

      await this.downloadedFileModel.findOneAndUpdate(
        { fileName },
        { fileName },
        { upsert: true, new: true },
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
        const percent = (processed / total) * 100;
        const globalPercent = 30 + (percent / 100) * 40;

        await this.cacheManager.set(
          'planet-sync-current-operation',
          `Extraindo arquivos de planetas (${percent.toFixed(2)}%)`,
          0,
        );
        await this.cacheManager.set(
          'planet-sync-global-progress',
          +globalPercent.toFixed(2),
          0,
        );
      }
    }

    this.reloadFiles();
    console.log('Descompactação de planetas concluída!');
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
