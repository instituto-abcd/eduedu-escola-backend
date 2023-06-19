import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { firebaseApp } from './firebase.service';
import { Planet } from './schemas/planet.schema';

@Injectable()
export class FirestoreService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = firebaseApp.firestore();
  }

  async getPlanets(): Promise<Array<Planet>> {
    const docRef = this.db.collection('planets');
    const docSnapshot = (await docRef.get()).docs;

    const docs = docSnapshot.map((doc) => doc.data()) as Planet[];

    return docs;
  }
}
