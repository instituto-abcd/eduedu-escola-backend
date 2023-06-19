import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Planet } from './schemas/planet.schema';
import { Model } from 'mongoose';
import { FirestoreService } from './firestore.service';

@Injectable()
export class ContentSyncService {
  constructor(
    @InjectModel(Planet.name) private planetModel: Model<Planet>,
    private readonly firestoreService: FirestoreService,
  ) {}

  async syncAll() {
    const planetsFromFirestore = await this.firestoreService.getPlanets();

    const mutation = await this.planetModel.bulkWrite(
      planetsFromFirestore.map((planet) => ({
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
}
