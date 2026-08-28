import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as unzipper from 'unzipper';
import * as mime from 'mime-types';
import { ApiGatewayService } from '../planet-sync/apiGateway.service';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { RequestContext } from '../common/request-context';
import { StorageService } from '../planet-sync/storage.service';

type StoredFile = { name: string; mimeType: string; extension: string };

@Injectable()
export class ExamStorageService {
  private files: StoredFile[] = [];
  private readonly assetsDir: string;
  private readonly legacyAssetsDir: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly storageService: StorageService,
  ) {
    // Os assets de prova ficam num subdiretório de assets-data porque essa é a
    // única pasta com volume no docker-compose do instalador. Antes viviam em
    // assets-data-exam/, fora de qualquer volume, e por isso eram perdidos toda
    // vez que o container era recriado (atualização, troca de versão, down/up),
    // fazendo recoverFileURL devolver null e o portal exibir o texto alternativo.
    this.assetsDir = path.resolve(__dirname, '../../assets-data/exam');
    this.legacyAssetsDir = path.resolve(__dirname, '../../assets-data-exam');

    fs.ensureDirSync(this.assetsDir);
    this.migrateLegacyAssets();
    this.reloadFiles();
  }

  // Instalações que ainda não recriaram o container têm os arquivos no lugar
  // antigo; move para o novo em vez de exigir uma nova sincronização de provas.
  private migrateLegacyAssets() {
    try {
      if (!fs.existsSync(this.legacyAssetsDir)) {
        return;
      }

      const legacyFiles = fs
        .readdirSync(this.legacyAssetsDir)
        .filter((file) =>
          fs.statSync(path.join(this.legacyAssetsDir, file)).isFile(),
        );

      if (!legacyFiles.length) {
        return;
      }

      console.log(
        `Movendo ${legacyFiles.length} assets de prova de ${this.legacyAssetsDir} para ${this.assetsDir}`,
      );

      for (const file of legacyFiles) {
        fs.moveSync(
          path.join(this.legacyAssetsDir, file),
          path.join(this.assetsDir, file),
          { overwrite: true },
        );
      }
    } catch (error) {
      console.error(
        'Erro ao migrar assets de prova do diretório antigo:',
        error,
      );
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
      // O ZIP de planetas também traz os assets de prova, e assets-data é
      // persistido. Quando o store de prova está vazio - container recriado
      // antes de uma nova sincronização de provas - o arquivo ainda pode ser
      // servido de lá, em vez de devolver null e cair no placeholder.
      return this.storageService.recoverFileURL(fileId);
    }

    const fileIdArray = fileId.split('.');

    // Em contexto HTTP a URL é montada a partir do host da própria requisição
    // (ver storage.service.ts); FILE_SERVER_URL é só o fallback fora de
    // requisições (ex.: jobs do Bull).
    const requestBaseUrl = RequestContext.baseUrl();
    const fileServerUrl = requestBaseUrl
      ? `${requestBaseUrl}/assets-data`
      : process.env.FILE_SERVER_URL || '';
    // Replace /assets-data with /assets-data-exam for exam assets
    const examFileServerUrl = fileServerUrl.replace(
      '/assets-data',
      '/assets-data-exam',
    );

    // Previne extensões de arquivo duplas, como .tar.gz ou mp3.mp3
    const url =
      fileIdArray.length > 1
        ? `${examFileServerUrl}/${fileIdArray[0]}.${fileExtension}`
        : `${examFileServerUrl}/${fileId}.${fileExtension}`;
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
      return null;
    }

    return file.extension;
  }

  async downloadExamAssets() {
    try {
      console.log('Iniciando download dos artefatos de prova');
      await this.cacheManager.set('exam-sync-running', true, 0);
      await this.cacheManager.set('exam-sync-synced-files', 0, 0);

      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Limpando pasta...',
        0,
      );
      await fs.emptyDir(this.assetsDir);

      // Download ZIP
      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Baixando ZIP de provas...',
        0,
      );
      await this.downloadZipAssets();

      // Extraction
      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Extraindo arquivos de prova...',
        0,
      );
      const filesLength = await this.extractZip();

      await this.cacheManager.set('exam-sync-total-files', filesLength, 0);
      console.log('Download e extração de provas concluídos.');

      await this.cacheManager.set('exam-sync-running', false, 0);
    } catch (error) {
      console.error('Erro no download dos artefatos de prova:', error);
      await this.cacheManager.set('exam-sync-running', false, 0);
      throw error;
    }
  }

  async downloadZipAssets(): Promise<void> {
    console.log('Iniciando download do zip de assets de prova...');
    const outputFile = path.join(this.assetsDir, 'assets.zip');
    await fs.ensureDir(this.assetsDir);

    try {
      const assetsResponse = await ApiGatewayService.getExamAssets();
      const totalLength = Number(assetsResponse.headers['content-length']) || 0;

      let downloaded = 0;
      const progress = new Transform({
        transform: async (chunk, _encoding, callback) => {
          downloaded += chunk.length;
          if (totalLength) {
            const percent = ((downloaded / totalLength) * 100).toFixed(2);
            await this.cacheManager.set(
              'exam-sync-current-operation',
              `Baixando ZIP de provas (${percent}%)`,
              0,
            );
            await this.cacheManager.set(
              'exam-sync-global-progress',
              +((+percent / 100) * 50).toFixed(2), // 50% of total for download
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
      console.log('ZIP de provas baixado com sucesso!');
    } catch (err) {
      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Erro no download do ZIP de provas',
        0,
      );
      console.log({ err });
      throw new Error('Erro ao baixar o arquivo ZIP de assets de prova');
    }
  }

  async extractZip(): Promise<number> {
    const zipPath = path.join(this.assetsDir, 'assets.zip');
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Arquivo ZIP não encontrado: ${zipPath}`);
    }

    console.log('Descompactando ZIP de provas...');
    const zipFiles = await unzipper.Open.file(zipPath);
    const total = zipFiles.files.length;
    let processed = 0;

    await this.cacheManager.set('exam-sync-total-files', total, 0);
    await this.cacheManager.set('exam-sync-synced-files', 0, 0);

    for (const entry of zipFiles.files) {
      const fileName = entry.path;
      const outputPath = path.join(this.assetsDir, fileName);
      await fs.ensureDir(path.dirname(outputPath));

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
        const globalPercent = 50 + (percent / 100) * 40; // 50-90% range

        await this.cacheManager.set(
          'exam-sync-current-operation',
          `Extraindo arquivos de prova (${percent.toFixed(2)}%)`,
          0,
        );
        await this.cacheManager.set(
          'exam-sync-global-progress',
          +globalPercent.toFixed(2),
          0,
        );
        await this.cacheManager.set('exam-sync-synced-files', processed, 0);
      }
    }

    this.reloadFiles();
    console.log('Descompactação de provas concluída!');
    return total;
  }
}
