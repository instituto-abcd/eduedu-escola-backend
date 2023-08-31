import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Planet, Question } from './schemas/planet.schema';
import { PlanetOrigin } from './schemas/planet-origin.schema';
import { Model } from 'mongoose';
import { FirestoreService } from './firestore.service';
import { PlanetSync } from './schemas/sync-list.schema';

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

    const mutation = await this.planetModel.bulkWrite(
      planetsToPersist.map((planet) => ({
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

  private parsePlanetOriginToPlanet(planetOrigin: PlanetOrigin): Planet {
    var planet = new Planet();
    planet.avatar_url = planetOrigin.avatar_url;
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

    planet.questions = planetOrigin.questions.map((questionOrigin) => {
      var question: Question = {
        orderedAnswer: questionOrigin.options.length > 0 && questionOrigin.options.every(o => !o.isCorrect),
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

        options: questionOrigin.options.map((optionOrigin) => {
          return {
            sound_url: optionOrigin.sound_url,
            image_url: optionOrigin.image_url,
            description: optionOrigin.description,
            position: optionOrigin.position,
            isCorrect: optionOrigin.isCorrect
          };
        }),

        titles: questionOrigin.titles.map((titleOrigin) => {
          return {
            file_url: titleOrigin.file_url,
            description: titleOrigin.description,
            position: titleOrigin.position,
            placeholder: titleOrigin.placeholder,
            type: titleOrigin.type
          };
        }),

        rules: questionOrigin.rules,
      };
      return question;
    });

    return planet;
  }

  private getAxisCode(axis_id: string): string {
    switch (axis_id) {
      case '8CbEeTJCWQnP6iPKXq0d':
        return 'LC'
      case 'xmgpLoYPvA02n2zSQqaB':
        return 'EA'
      case 'LNrgxvkhlGc3M4Ekm4Tz':
        return 'ES'
      default:
        break;
    }
  }
}
