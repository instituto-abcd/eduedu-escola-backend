import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Planet } from './schemas/planet.schema';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { Model } from 'mongoose';
import { FirestoreService } from './firestore.service';
import { PlanetSync } from './schemas/sync-list.schema';
import got from 'got';
import { StorageService } from './storage.service';

@Injectable()
export class PlanetSyncService {
  constructor(
    @InjectModel(Planet.name) private planetModel: Model<Planet>,
    @InjectModel(PlanetSync.name) private planetSyncModel: Model<PlanetSync>,
    private readonly firestoreService: FirestoreService,
    private readonly storageService: StorageService,
  ) {}

  async testStream() {
    // IMAGEM
    // const fileURL =
    //   'https://storage.googleapis.com/eduedu-escola-hub---stg.appspot.com/assets/vg28uAm0odQKMPsBhjXT?GoogleAccessId=firebase-adminsdk-tv4j7%40eduedu-escola-hub---stg.iam.gserviceaccount.com&Expires=33216274109&Signature=NLU%2BA%2FSf4%2FQ7TlphzB0taCqCy4pL2oujW4Lz8Gx3qqGpFSJFqhperPEMM2VxUJ98%2FX5btOZR%2F1WScQvSBxDCCx9%2F%2B2NxOsRggCFRdxmgcOr2zmouPlArcMMsoxLXql%2FlBLnLi9IvYveOP4WttOFxaQeYk54uBX%2FqmzHAxWNpnYa66e0iPUbWIC1UE5l5B8%2BtXPALYZTjh5ePiPiA2SqHGvQReVrSAmwWZkU3B6cqzDmvp4WBhVu85%2BdBFjZYjEI2vX22YEvz%2BLLKJrJodLvLsU97DtIj%2FlQiv1Okg8b3c8SEbg4d7dV%2ByXHJDqJgqG3%2B2Fl%2BEuzBNqDoj1%2FJLwZQzQ%3D%3D';
    let imageId = '18ae9482-ab11-4481-833b-d8e8e0033aca'
    let imageExtension = await this.storageService.getFileExtensionByFileName(imageId);
    console.log(imageExtension);

    // AUDIO
    // let fileURL = 'https://storage.googleapis.com/eduedu-escola-hub---stg.appspot.com/assets/EOnQLGZQTWbdv2YRiSkz?GoogleAccessId=firebase-adminsdk-tv4j7%40eduedu-escola-hub---stg.iam.gserviceaccount.com&Expires=33216284791&Signature=kYF2BteGA8uuGbvwWdZUGpxKqi4F%2FlPQmN%2FGW3rDz1AiQ1elfks7Bzkt4sIPaRs3%2BBfBnB%2FhhMMFqv4qVu43H202rBxoMgGDmzFK4FD4zSoqL5kRtryVh4%2FlU5Be0AU%2BYEHYnf1hAqN94q6LIuZjVvNfnc4qSMMskpHvCMLn2xdnj5WIzGLNQB89XuthKNZhj0JIXRQZ3ZUmREsqrkyESq2tNCTnXKF0WeYsm%2FbD%2FF5soyU2Nk%2FykTANvGH%2Fv8iOMYICBV39jcirFNLemElA44oxuRQZK4J7CW57ju6z1m8VggSnPIuZlG8uMZ7IaFaiofI1PVQNrs3m1D%2BIl6Lecw%3D%3D';
    let audioId = 'EOnQLGZQTWbdv2YRiSkz';
    let audioExtension = await this.storageService.getFileExtensionByFileName(audioId);
    console.log(audioExtension);

    // VIDEO
    // let fileURL = 'https://storage.googleapis.com/eduedu-escola-hub---stg.appspot.com/assets/HJsTc7PHj4skb3CR3IR5?GoogleAccessId=firebase-adminsdk-tv4j7%40eduedu-escola-hub---stg.iam.gserviceaccount.com&Expires=33216284791&Signature=PGJpid%2F%2B%2FZr%2FZVi%2BpQBVh6VE%2FpRe%2B0QtuqnkfDPHoY3fBu%2FePfz3ZIGjrj5ydMCJHshRedwDiAyQIcROgBqbQ8sjNcCtTUkN7oYLwntO4B3HB6Rq7C9bFNJXMxMAl36AMiweBthNik7I%2B8AujaI9hARD%2FC2h4kcUNxs%2BnRo4ESWTDp9cPEj5Px5VNt6HXnojibEhCVus2oi%2B9SwhQN6dzulx4FNjQit6ayPUpNvMlcrwrlbWVXFTLzRL6RzOrUwqj9QO8cVND6WncAQsE147PPdUMf4f0uft0DEhC19hrzQR6gvjKokPENEldwrPVUjtISrtR2djN%2BVpab6RRHxsfA%3D%3D'
    let videoId = 'HJsTc7PHj4skb3CR3IR5';
    let videoExtension = await this.storageService.getFileExtensionByFileName(videoId);
    console.log(videoExtension);

    return true;
  }

  private getFileExtension(response: any): string {
    const contentType = response.headers['content-type'];
    if (contentType) {
      if (contentType.includes('image/svg+xml')) {
        return '.svg';
      } else if (contentType.includes('audio/mpeg')) {
        return '.mp3';
      } else if (contentType.includes('video/mp4')) {
        return '.mp4';
      }
    }
    return '';
  }

  async syncAll() {
    let planetsFromFirestore = await this.firestoreService.getPlanets();

    let planetsToPersist = [];
    for (let index = 0; index < planetsFromFirestore.length; index++) {
      let processedPlanet = await this.parsePlanetOriginToPlanet(planetsFromFirestore[index]);
      planetsToPersist.push(processedPlanet);
    }

    const mutation = await this.planetModel.bulkWrite(
      planetsToPersist.map((planet) => ({
        updateOne: {
          filter: { id: planet.id },
          update: planet,
          upsert: true,
        },
      })),
    );

    return {
      success: mutation.isOk(),
      planetsSynced: mutation.upsertedCount,
      planetsUpdated: mutation.modifiedCount,
    };
  }

  async addToSyncList(planetId: string) {
    return await this.planetSyncModel.findOneAndUpdate(
      { planetId },
      { receivedAt: new Date(), synced: false },
      { upsert: true, new: true, returnDocument: 'after' },
    );
  }

  async sync() {
    const planetsToSync = await this.planetSyncModel
      .find({ synced: false }, { planetId: 1, _id: 0 })
      .lean(true);

    if (!planetsToSync.length)
      return { success: true, planetsSynced: 0, planetsUpdated: 0 };

    const planetsFromFirestore = await Promise.all(
      planetsToSync.map((planet) =>
        this.firestoreService.getPlanet(planet.planetId),
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
      planet.avatar_url = await this.recoverFileURL(
        planet.avatar_id,
        planetOrigin?.avatar_url,
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
          multiplesAnswer:
            questionOrigin.options.length > 0 &&
            questionOrigin.options.some((o) => !o.isCorrect) &&
            questionOrigin.options.filter((option) => option.isCorrect).length >
              1,
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
          rules: questionOrigin.rules
        } as any;

        for (let optionIndex = 0; optionIndex < questionOrigin.options.length; optionIndex++) {
          const optionOrigin = questionOrigin.options[optionIndex];
          const option = {
            sound_id: optionOrigin.sound_id,
            image_id: optionOrigin.image_id,
            sound_url: await this.recoverFileURL(
              optionOrigin.sound_id,
              optionOrigin.sound_url,
            ),
            image_url: await this.recoverFileURL(
              optionOrigin.image_id,
              optionOrigin.image_url,
            ),
            description: optionOrigin.description,
            position: optionOrigin.position,
            isCorrect: optionOrigin.isCorrect,
          } as any;
          
          question.options.push(option);
        }

        for (let titleIndex = 0; titleIndex < questionOrigin.titles.length; titleIndex++) {
          const titleOrigin = questionOrigin.titles[titleIndex];
          const title = {
            file_id: titleOrigin.file_id,
            file_url: await this.recoverFileURL(
              titleOrigin.file_id,
              titleOrigin.file_url,
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

      console.log(`- Planet ${planet.title} Synced`);

      return planet;
    } catch (error) {
      console.log(`- ERROR: Planet ${planetOrigin.title}`);
      console.log(error);
      throw error;
    }
  }

  private async recoverFileURL(
    id: string | null,
    url: string | null,
  ): Promise<string | null> {
    if (url === null || url === undefined) {
      return '';
    }

    const fileServerUrl = process.env.FILE_SERVER_URL;
    const fileExtension = await this.storageService.getFileExtensionByFileName(id);
    return `${fileServerUrl}/${id}${fileExtension}`;
  }

  private async fetchFile(
    fileServerUrl: string,
    id: string | null,
    url: string,
  ): Promise<string | null> {
    try {
      const response = await got(url);

      if (response.statusCode === 200) {
        const fileExtension = this.getFileExtension(response);
        return `${fileServerUrl}/${id}${fileExtension}`;
      } else {
        console.error(`Request failed with status code ${response.statusCode}`);
        return null;
      }
    } catch (e) {
      console.error(e);
      return null;
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
}
