import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Planet } from './schemas/planet.schema';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { Model } from 'mongoose';
import { GatewayService } from './gateway.service';
import { PlanetSync } from './schemas/sync-list.schema';
import { StorageService } from './storage.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue } from 'bull';
import { DateFormatterUtilsService } from '../common/utils/date-formatter-utils.service';
import { DownloadedFile } from './schemas/download-file.schema';
import { StudentService } from '../student/student.service';
import { ExamService } from '../exam/exam.service';
import { LastSync } from './schemas/last-sync.schema';
import { LastSyncResponseDto } from './dto/last-sync-response.dto';
import { AccessKeyService } from 'src/access-key/accessKey.service';

@Injectable()
export class PlanetSyncService {
  constructor(
    @InjectModel(Planet.name) private planetModel: Model<Planet>,
    @InjectModel(PlanetSync.name) private planetSyncModel: Model<PlanetSync>,
    @InjectModel(LastSync.name) private lastSyncModel: Model<LastSync>,
    @InjectModel(DownloadedFile.name)
    private downloadedFileModel: Model<DownloadedFile>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('planet-sync') private readonly planetSyncQueue: Queue,
    private readonly gatewayService: GatewayService,
    private readonly storageService: StorageService,
    private readonly studentService: StudentService,
    private readonly examService: ExamService,
    private readonly accessKeyService: AccessKeyService,
  ) {}

  async testStream() {
    // IMAGEM
    // const fileURL =
    //   'https://storage.googleapis.com/eduedu-escola-hub---stg.appspot.com/assets/vg28uAm0odQKMPsBhjXT?GoogleAccessId=firebase-adminsdk-tv4j7%40eduedu-escola-hub---stg.iam.gserviceaccount.com&Expires=33216274109&Signature=NLU%2BA%2FSf4%2FQ7TlphzB0taCqCy4pL2oujW4Lz8Gx3qqGpFSJFqhperPEMM2VxUJ98%2FX5btOZR%2F1WScQvSBxDCCx9%2F%2B2NxOsRggCFRdxmgcOr2zmouPlArcMMsoxLXql%2FlBLnLi9IvYveOP4WttOFxaQeYk54uBX%2FqmzHAxWNpnYa66e0iPUbWIC1UE5l5B8%2BtXPALYZTjh5ePiPiA2SqHGvQReVrSAmwWZkU3B6cqzDmvp4WBhVu85%2BdBFjZYjEI2vX22YEvz%2BLLKJrJodLvLsU97DtIj%2FlQiv1Okg8b3c8SEbg4d7dV%2ByXHJDqJgqG3%2B2Fl%2BEuzBNqDoj1%2FJLwZQzQ%3D%3D';
    // let imageId = '18ae9482-ab11-4481-833b-d8e8e0033aca'
    // let imageExtension = await this.storageService.getFileExtensionByFileName_(imageId);
    // console.log(imageExtension);

    // AUDIO
    // let fileURL = 'https://storage.googleapis.com/eduedu-escola-hub---stg.appspot.com/assets/EOnQLGZQTWbdv2YRiSkz?GoogleAccessId=firebase-adminsdk-tv4j7%40eduedu-escola-hub---stg.iam.gserviceaccount.com&Expires=33216284791&Signature=kYF2BteGA8uuGbvwWdZUGpxKqi4F%2FlPQmN%2FGW3rDz1AiQ1elfks7Bzkt4sIPaRs3%2BBfBnB%2FhhMMFqv4qVu43H202rBxoMgGDmzFK4FD4zSoqL5kRtryVh4%2FlU5Be0AU%2BYEHYnf1hAqN94q6LIuZjVvNfnc4qSMMskpHvCMLn2xdnj5WIzGLNQB89XuthKNZhj0JIXRQZ3ZUmREsqrkyESq2tNCTnXKF0WeYsm%2FbD%2FF5soyU2Nk%2FykTANvGH%2Fv8iOMYICBV39jcirFNLemElA44oxuRQZK4J7CW57ju6z1m8VggSnPIuZlG8uMZ7IaFaiofI1PVQNrs3m1D%2BIl6Lecw%3D%3D';
    // let audioId = 'EOnQLGZQTWbdv2YRiSkz';
    // let audioExtension = await this.storageService.getFileExtensionByFileName_(audioId);
    // console.log(audioExtension);

    // VIDEO
    // let fileURL = 'https://storage.googleapis.com/eduedu-escola-hub---stg.appspot.com/assets/HJsTc7PHj4skb3CR3IR5?GoogleAccessId=firebase-adminsdk-tv4j7%40eduedu-escola-hub---stg.iam.gserviceaccount.com&Expires=33216284791&Signature=PGJpid%2F%2B%2FZr%2FZVi%2BpQBVh6VE%2FpRe%2B0QtuqnkfDPHoY3fBu%2FePfz3ZIGjrj5ydMCJHshRedwDiAyQIcROgBqbQ8sjNcCtTUkN7oYLwntO4B3HB6Rq7C9bFNJXMxMAl36AMiweBthNik7I%2B8AujaI9hARD%2FC2h4kcUNxs%2BnRo4ESWTDp9cPEj5Px5VNt6HXnojibEhCVus2oi%2B9SwhQN6dzulx4FNjQit6ayPUpNvMlcrwrlbWVXFTLzRL6RzOrUwqj9QO8cVND6WncAQsE147PPdUMf4f0uft0DEhC19hrzQR6gvjKokPENEldwrPVUjtISrtR2djN%2BVpab6RRHxsfA%3D%3D'
    // let videoId = 'HJsTc7PHj4skb3CR3IR5';
    // let videoExtension = await this.storageService.getFileExtensionByFileName_(videoId);
    // console.log(videoExtension);

    // let planetAvatarId = '01xX94qpgGv9PBxUSOdN';
    // let planetAvatarExtension = await this.storageService.handleFile('planets', planetAvatarId);

    // let assetFileId = '00zPfsrj2f6uUqeeTO1K';
    // let assetFileExtension = await this.storageService.handleFile('assets', assetFileId);

    const { accessKey } = await this.accessKeyService.getSettingsBySchoolId();

    await this.storageService.downloadFiles(accessKey);

    return true;
  }

  async getPlanetSyncStatus(): Promise<any> {
    const empty = [undefined, null];
    const cachedValue = await this.cacheManager.get('sync-running');
    const running = cachedValue !== undefined ? cachedValue : false;

    const currentOperationCached = await this.cacheManager.get(
      'sync-current-operation',
    );
    const currentOperation =
      currentOperationCached !== undefined ? currentOperationCached : '';

    const totalFiles = empty.includes(
      await this.cacheManager.get('sync-total-files'),
    )
      ? 0
      : await this.cacheManager.get('sync-total-files');

    const totalPlanetsCached = await this.cacheManager.get(
      'sync-total-planets',
    );
    const totalPlanets =
      totalPlanetsCached !== undefined ? totalPlanetsCached : 0;

    const syncCurrentStart = (await this.cacheManager.get(
      'sync-current-start',
    )) as Date;
    const syncCurrentEnd = (await this.cacheManager.get(
      'sync-current-end',
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

    const syncedFiles = await this.downloadedFileModel.countDocuments();

    const syncedPlanetsCached = await this.cacheManager.get(
      'sync-synced-planets',
    );
    const syncedPlanets =
      syncedPlanetsCached !== undefined ? syncedPlanetsCached : 0;

    const factor = +totalFiles / +totalPlanets;
    const percent =
      +(
        +totalFiles + +totalPlanets > 0
          ? ((+syncedFiles + +syncedPlanets * factor) /
              (+totalFiles + +totalPlanets * factor)) *
            100
          : 0
      ).toFixed(2) ?? 0;

    return {
      totalFiles,
      syncedFiles,
      totalPlanets,
      syncedPlanets,
      percent,
      duration,
      running,
      currentOperation,
    };
  }

  async enqueueSyncAll() {
    const start = new Date();
    await this.cacheManager.del('sync-current-end');
    await this.cacheManager.set('sync-current-start', start, 0);
    this.planetSyncQueue.add('planet-job', { planetSync: new Date() });
    await this.cacheManager.set('sync-running', true, 0);
  }

  async handleSyncAll() {
    console.log(
      'Planet Sync - Iniciando sincronização de documentos do firestore',
    );

    await this.updateLastSync();

    const { accessKey } = await this.accessKeyService.getSettingsBySchoolId();

    await this.storageService.downloadFiles(accessKey);

    const planetsFromFirestore = await this.gatewayService.getPlanets(
      accessKey,
    );
    this.cacheManager.set('sync-total-planets', planetsFromFirestore.length, 0);

    const planetsInsertedOrUpdated = [];
    for (let index = 0; index < planetsFromFirestore.length; index++) {
      try {
        const planet = await this.parsePlanetOriginToPlanet(
          planetsFromFirestore[index],
        );

        await this.planetModel
          .findOneAndUpdate({ id: planet.id }, planet, {
            upsert: true,
            new: true,
          })
          .exec();

        planetsInsertedOrUpdated.push(planet);
        this.cacheManager.set(
          'sync-synced-planets',
          planetsInsertedOrUpdated.length,
          0,
        );
      } catch (error) {
        console.log(
          `Erro ao processar planeta ${planetsFromFirestore[index].title}:`,
        );
        console.error(error);
      }
    }

    await this.cacheManager.set(
      'sync-current-operation',
      'Baixando Artefatos',
      0,
    );

    await this.studentService.syncPlanetStudent();

    console.log(
      'Planet Sync - Sincronização de documentos do firestore concluída',
    );
    return {
      success: true,
      planetsSynced: planetsInsertedOrUpdated.length,
    };
  }

  async getLastSync(): Promise<LastSyncResponseDto> {
    const lastSync = await this.lastSyncModel.findOneAndUpdate();

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

  async updateLastSync(): Promise<Model<LastSync>> {
    return await this.lastSyncModel.findOneAndUpdate(
      {},
      { syncedAt: new Date() },
      { upsert: true, new: true, returnDocument: 'after' },
    );
  }

  async addToSyncList(planetId: string) {
    return await this.planetSyncModel.findOneAndUpdate(
      { planetId },
      { receivedAt: new Date(), synced: false },
      { upsert: true, new: true, returnDocument: 'after' },
    );
  }

  async sync() {
    await this.updateLastSync();

    const planetsToSync = await this.planetSyncModel
      .find({ synced: false }, { planetId: 1, _id: 0 })
      .lean(true);

    if (!planetsToSync.length)
      return { success: true, planetsSynced: 0, planetsUpdated: 0 };

    const { accessKey } = await this.accessKeyService.getSettingsBySchoolId();

    const planetsFromFirestore = await Promise.all(
      planetsToSync.map((planet) =>
        this.gatewayService.getPlanet(planet.planetId, accessKey),
      ),
    );

    const planetsToPersist = planetsFromFirestore.map((planetOrigin) => {
      return this.parsePlanetOriginToPlanet(planetOrigin);
    });

    const resolvedPlanets = await Promise.all(planetsToPersist);

    const mutation = await this.planetModel.bulkWrite(
      resolvedPlanets.map((planet) => ({
        updateOne: {
          filter: { id: planet.id },
          update: planet,
          upsert: true,
        },
      })),
    );

    if (mutation.isOk()) {
      await this.planetSyncModel.updateMany(
        { synced: false },
        { synced: true, syncedAt: new Date() },
      );
    }

    return {
      success: mutation.isOk(),
      planetsSynced: mutation.upsertedCount,
      planetsUpdated: mutation.modifiedCount,
    };
  }

  private async parsePlanetOriginToPlanet(
    planetOrigin: PlanetOrigin,
  ): Promise<Planet> {
    try {
      const planet = new Planet();
      planet.avatar_id = planetOrigin?.avatar?.replace(/^planets\//, '');
      planet.avatar_url = await this.storageService.recoverFileURL(
        planet?.avatar_id,
      );
      planet.axis_code = this.getAxisCode(planetOrigin.axis_id);
      planet.domain_code = planetOrigin.domain_code;
      planet.enable = planetOrigin.enable;
      planet.id = planetOrigin.id;
      planet.level = planetOrigin.level;
      planet.next_planet_id = planetOrigin.next_bundle_id;
      planet.position = planetOrigin.position;
      planet.status = planetOrigin.status;
      planet.title = planetOrigin.title;
      planet.updated_at = planetOrigin.updated_at;
      planet.questions = [];

      for (let index = 0; index < planetOrigin.questions.length; index++) {
        const questionOrigin = planetOrigin.questions[index];
        const question = {
          orderedAnswer:
            questionOrigin.options.length > 0 &&
            questionOrigin.options.every((o) => !o.isCorrect),
          multiplesAnswer: this.getMultiplesAnswer(questionOrigin),
          level: questionOrigin.level,
          id: questionOrigin.id,
          model_id: questionOrigin.model_id,
          description: questionOrigin.description,
          planet_id: questionOrigin.planet_id,
          position: questionOrigin.position,
          status: questionOrigin.status,
          title: questionOrigin.title,
          bncc: questionOrigin.bncc,
          updated_at: questionOrigin.updated_at,
          options: [],
          titles: [],
          rules: questionOrigin.rules,
        } as any;

        for (
          let optionIndex = 0;
          optionIndex < questionOrigin.options.length;
          optionIndex++
        ) {
          const optionOrigin = questionOrigin.options[optionIndex];
          const option = {
            sound_id: optionOrigin.sound_id,
            image_id: optionOrigin.image_id,
            sound_url: await this.storageService.recoverFileURL(
              optionOrigin?.sound_id,
            ),
            image_url: await this.storageService.recoverFileURL(
              optionOrigin?.image_id,
            ),
            description: optionOrigin.description,
            position:
              questionOrigin.model_id == 'MODEL3'
                ? optionIndex
                : optionOrigin.position,
            isCorrect: optionOrigin.isCorrect,
          } as any;

          question.options.push(option);
        }

        for (
          let titleIndex = 0;
          titleIndex < questionOrigin.titles.length;
          titleIndex++
        ) {
          const titleOrigin = questionOrigin.titles[titleIndex];
          const title = {
            file_id: titleOrigin.file_id,
            file_url: await this.storageService.recoverFileURL(
              titleOrigin?.file_id,
            ),
            description: titleOrigin.description,
            position: titleOrigin.position,
            placeholder: titleOrigin.placeholder,
            type: titleOrigin.type,
          } as any;

          question.titles.push(title);
        }

        planet.questions.push(question);
      }

      return planet;
    } catch (error) {
      console.log(`- ERROR: Planet ${planetOrigin.title}`);
      console.log(error);
      throw error;
    }
  }

  private getMultiplesAnswer(questionOrigin: any) {
    switch (questionOrigin.model_id) {
      case 'MODEL5':
        return true;
      default:
        return (
          questionOrigin.options.length > 0 &&
          questionOrigin.options.some((o) => !o.isCorrect) &&
          questionOrigin.options.filter((option) => option.isCorrect).length > 1
        );
    }
  }

  private getAxisCode(axis_id: string): string {
    switch (axis_id) {
      case '8CbEeTJCWQnP6iPKXq0d':
        return 'LC';
      case 'xmgpLoYPvA02n2zSQqaB':
        return 'EA';
      case 'LNrgxvkhlGc3M4Ekm4Tz':
        return 'ES';
      default:
        break;
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

@Processor('planet-sync')
export class PlanetSyncProcessor {
  constructor(
    private readonly planetSyncService: PlanetSyncService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dateFormatterUtilsService: DateFormatterUtilsService,
    private readonly examService: ExamService,
  ) {}

  @Process('planet-job')
  async processPlanetSync() {
    try {
      console.log('Planet Sync - Iniciando sincronização');
      this.cacheManager.set('sync-synced-planets', 0, 0);

      const syncKey = 'sync-running';
      const syncValue = true;
      const syncDuration = 0;

      await this.cacheManager.set(syncKey, syncValue, syncDuration);

      await this.cacheManager.set(
        'sync-current-operation',
        'Baixando Artefatos',
        0,
      );

      const promises = [];

      promises.push(this.planetSyncService.handleSyncAll());

      promises.push(this.examService.syncExams());

      const start = new Date();

      await Promise.all(promises);

      const end = new Date();
      const duration = this.dateFormatterUtilsService.convertMsToTime(
        end.getTime() - start.getTime(),
      );

      await this.cacheManager.set('sync-current-end', end, 0);
      await this.cacheManager.set(syncKey, !syncValue, syncDuration);

      await this.cacheManager.set('sync-current-operation', '', 0);

      console.log('Planet Sync - Sincronização concluída');
      console.log('-------------------------------------');
      console.log('Planet Sync - Duração Sincronização: ' + duration);
    } catch (error) {
      console.error('Erro durante a sincronização:', error);
    } finally {
      await this.cacheManager.set('sync-running', false, 0);
      await this.cacheManager.set('sync-current-operation', '', 0);
    }
  }
}
