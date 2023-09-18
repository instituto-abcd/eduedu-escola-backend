import { Injectable, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Planet, Question } from './schemas/planet.schema';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { Model } from 'mongoose';
import { FirestoreService } from './firestore.service';
import { PlanetSync } from './schemas/sync-list.schema';
import axios from 'axios';
import mime from 'mime-types'; // Import the 'mime-types' library

@Injectable()
export class PlanetSyncService {
  constructor(
    @InjectModel(Planet.name) private planetModel: Model<Planet>,
    @InjectModel(PlanetSync.name) private planetSyncModel: Model<PlanetSync>,
    private readonly firestoreService: FirestoreService,
  ) {}

  async syncAll() {
    const planetsFromFirestore = await this.firestoreService.getPlanets();

    const planetsToPersist = planetsFromFirestore.map((planetOrigin) => {
      return this.parsePlanetOriginToPlanet(planetOrigin);
    });

    const mutation = await this.planetModel.bulkWrite(
      await Promise.all(
        planetsToPersist.map(async (planetPromise) => {
          const planet = await planetPromise;

          return {
            updateOne: {
              filter: { id: planet.id },
              update: planet,
              upsert: true,
            },
          };
        }),
      ),
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
    const planet = new Planet();
    planet.avatar_id = planetOrigin?.avatar?.replace(/^planets\//, '');
    planet.avatar_url = await this.recoverFileURL(
      planet.avatar_id,
      planet.avatar_url,
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

    planet.questions = await Promise.all(
      planetOrigin.questions.map(async (questionOrigin) => {
        const question: Question = {
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

          options: await Promise.all(
            questionOrigin.options.map(async (optionOrigin) => {
              return {
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
              };
            }),
          ),

          titles: await Promise.all(
            questionOrigin.titles.map(async (titleOrigin) => {
              const file_url = await this.recoverFileURL(
                titleOrigin.file_id,
                titleOrigin.file_url,
              );

              return {
                file_id: titleOrigin.file_id,
                file_url,
                description: titleOrigin.description,
                position: titleOrigin.position,
                placeholder: titleOrigin.placeholder,
                type: titleOrigin.type,
              };
            }),
          ),

          rules: questionOrigin.rules,
        };
        return question;
      }),
    );

    return planet;
  }

  private async recoverFileURL(
    id: string | null,
    url: string | null,
  ): Promise<string | null> {
    if (url === null) {
      return null;
    }

    const serverUrl = process.env.FILE_SERVER_URL;
    const fileServerPort = process.env.FILE_SERVER_PORT;

    if (!serverUrl || !fileServerPort) {
      return null;
    }

    const fileServerUrl = `${serverUrl}:${fileServerPort}`;
    const fileExtension = await this.getExtensionFromUrl(url);

    if (fileExtension === null) {
      return null;
    }

    return `${fileServerUrl}/${id}.${fileExtension}`;
  }

  async getExtensionFromUrl(url: string): Promise<{ extension: string }> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 50000,
      });

      const contentType = response.headers['content-type'];

      if (contentType) {
        // Determine the file extension based on content type
        const fileExtension = mime.extension(contentType);

        if (fileExtension) {
          return { extension: fileExtension };
        } else {
          console.log('Could not determine file extension');
        }
      } else {
        console.log('Content-Type header not found in response');
      }

      // Return a default value or throw an exception if needed
      return { extension: 'unknown' }; // Replace 'unknown' with your desired default extension
    } catch (error) {
      console.log('Error fetching URL: ', url);
      console.error(error); // Log the error for debugging

      // Handle the error appropriately, e.g., throw an exception
      throw error;
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
