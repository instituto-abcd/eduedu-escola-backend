import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { GatewayService } from '../planet-sync/gateway.service';
import { Exam, IExam, Question } from './schemas/exam.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ExamStorageService } from './exam-storage.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue } from 'bull';
import { LastExamSync } from './schemas/last-exam-sync.schema';
import { LastExamSyncResponseDto } from './dto/last-exam-sync-response.dto';
import { DateFormatterUtilsService } from '../common/utils/date-formatter-utils.service';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<Exam>,
    @InjectModel(LastExamSync.name)
    private lastExamSyncModel: Model<LastExamSync>,
    @InjectQueue('exam-sync') private readonly examSyncQueue: Queue,
    private readonly gatewayService: GatewayService,
    private readonly examStorageService: ExamStorageService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getExamQuestions(): Promise<Question[]> {
    const currentExam = await this.examModel.findOne({ status: 'ACTIVE' });
    return this.enrichExamQuestionsUrls(currentExam.questions);
  }

  async enrichExamQuestionsUrls(questions: Question[]): Promise<Question[]> {
    return Promise.all(questions.map((q) => this.enrichExamQuestionUrls(q)));
  }

  async enrichExamQuestionUrls(question: Question): Promise<Question> {
    const options = await Promise.all(
      question.options.map(async (option) => ({
        ...option,
        image_url: await this.examStorageService.recoverFileURL(option.image_name),
        sound_url: await this.examStorageService.recoverFileURL(option.sound_name),
      })),
    );
    const titles = await Promise.all(
      question.titles.map(async (title) => ({
        ...title,
        file_url: await this.examStorageService.recoverFileURL(title.file_name),
      })),
    );
    return { ...question, options, titles };
  }

  async enqueueSyncExams() {
    await this.gatewayService.getExams();

    const start = new Date();
    await this.cacheManager.del('exam-sync-current-end');
    await this.cacheManager.set('exam-sync-current-start', start, 0);

    // Limpa jobs anteriores
    await this.examSyncQueue.obliterate({ force: true });

    this.examSyncQueue.add('exam-job', { examSync: new Date() });
    await this.cacheManager.set('exam-sync-running', true, 0);
  }

  async getExamSyncStatus(): Promise<any> {
    const empty = [undefined, null];
    const cachedValue = await this.cacheManager.get('exam-sync-running');
    const running = cachedValue !== undefined ? cachedValue : false;

    const currentOperationCached = await this.cacheManager.get(
      'exam-sync-current-operation',
    );
    const currentOperation =
      currentOperationCached !== undefined ? currentOperationCached : '';

    const totalFiles = empty.includes(
      await this.cacheManager.get('exam-sync-total-files'),
    )
      ? 0
      : await this.cacheManager.get('exam-sync-total-files');

    const syncedFilesCached = await this.cacheManager.get(
      'exam-sync-synced-files',
    );
    const syncedFiles = syncedFilesCached !== undefined ? syncedFilesCached : 0;

    const syncCurrentStart = (await this.cacheManager.get(
      'exam-sync-current-start',
    )) as Date;
    const syncCurrentEnd = (await this.cacheManager.get(
      'exam-sync-current-end',
    )) as Date;

    let duration = '00:00:00';
    if (syncCurrentStart != null) {
      if (syncCurrentEnd != null) {
        duration = this.convertMsToTime(
          syncCurrentEnd.getTime() - syncCurrentStart.getTime(),
        );
      } else {
        duration = this.convertMsToTime(
          new Date().getTime() - syncCurrentStart.getTime(),
        );
      }
    }

    const globalProgressCached = await this.cacheManager.get(
      'exam-sync-global-progress',
    );
    const percent =
      globalProgressCached !== undefined ? +globalProgressCached : 0;

    return {
      totalFiles,
      syncedFiles,
      percent: Number(percent.toFixed(2)) || 0,
      duration,
      running,
      currentOperation,
    };
  }

  async getLastExamSync(): Promise<LastExamSyncResponseDto> {
    const lastSync = await this.lastExamSyncModel.findOne();

    const syncedAt = lastSync?.syncedAt ?? null;
    const daysSinceLastSync = syncedAt
      ? Math.floor(
          (new Date().getTime() - new Date(syncedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;
    const showReminder = daysSinceLastSync === null || daysSinceLastSync >= 60;

    return {
      syncedAt,
      daysSinceLastSync,
      showReminder,
    };
  }

  async updateLastExamSync(): Promise<Model<LastExamSync>> {
    return await this.lastExamSyncModel.findOneAndUpdate(
      {},
      { syncedAt: new Date() },
      { upsert: true, new: true, returnDocument: 'after' },
    );
  }

  async fullSyncExams() {
    try {
      console.log('Exam Sync - Iniciando sincronizacao de provas');
      await this.updateLastExamSync();

      await this.cacheManager.set('exam-sync-running', true, 0);
      await this.cacheManager.set('exam-sync-global-progress', 0, 0);

      // Step 1: Download and extract exam assets
      await this.examStorageService.downloadExamAssets();

      // Step 2: Sync exam data
      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Sincronizando dados de provas...',
        0,
      );
      await this.cacheManager.set('exam-sync-global-progress', 90, 0);

      const exams = await this.gatewayService.getExams();

      const mutation = await this.examModel.bulkWrite(
        exams.map((exam) => ({
          updateOne: {
            filter: { id: exam.id },
            update: exam,
            upsert: true,
          },
        })),
      );

      await this.cacheManager.set('exam-sync-global-progress', 100, 0);
      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Concluido',
        0,
      );
      await this.cacheManager.set('exam-sync-running', false, 0);

      return {
        success: mutation.isOk(),
        examsSynced: mutation.upsertedCount,
        examsUpdated: mutation.modifiedCount,
      };
    } catch (e) {
      console.error('Erro na sincronizacao de provas:', e);
      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Erro na sincronizacao',
        0,
      );
      await this.cacheManager.set('exam-sync-running', false, 0);
      return null;
    }
  }

  private padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
  }

  private convertMsToTime(milliseconds: number) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    return `${this.padTo2Digits(hours)}:${this.padTo2Digits(
      minutes,
    )}:${this.padTo2Digits(seconds)}`;
  }
}

@Processor('exam-sync')
export class ExamSyncProcessor {
  constructor(
    private readonly examService: ExamService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dateFormatterUtilsService: DateFormatterUtilsService,
  ) {}

  @Process('exam-job')
  async processExamSync() {
    const syncKey = 'exam-sync-running';
    await this.cacheManager.set(syncKey, true, 0);
    await this.cacheManager.set(
      'exam-sync-current-operation',
      'Preparando para baixar ZIP de provas...',
      0,
    );
    await this.cacheManager.set('exam-sync-global-progress', 0, 0);

    try {
      console.log('Exam Sync - Iniciando sincronizacao em background');

      const start = new Date();

      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Sincronizando Provas',
        0,
      );

      const result = await this.examService.fullSyncExams();

      // Se fullSyncExams retornou null, significa que houve erro (ja registrado no cache)
      if (result === null) {
        console.error('Exam Sync falhou - erro ja registrado no cache');
        return;
      }

      await this.cacheManager.set('exam-sync-global-progress', 100, 0);
      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Concluido',
        0,
      );

      const end = new Date();
      const duration = this.dateFormatterUtilsService.convertMsToTime(
        end.getTime() - start.getTime(),
      );

      await this.cacheManager.set('exam-sync-current-end', end, 0);
      await this.cacheManager.set(syncKey, false, 0);

      console.log(`Exam Sync concluido em ${duration}`);
    } catch (error) {
      console.error('Erro durante a sincronizacao de provas:', error);
      await this.cacheManager.set(
        'exam-sync-current-operation',
        'Erro na sincronizacao',
        0,
      );
    } finally {
      await this.cacheManager.set(syncKey, false, 0);
    }
  }
}
