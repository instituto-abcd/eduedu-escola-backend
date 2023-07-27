import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { firebaseApp } from './firebase.service';
import { Planet } from './schemas/planet.schema';
import { IExam } from 'src/exam/schemas/exam.schema';

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

  async getPlanet(planetId: string): Promise<Planet> {
    const docRef = this.db.collection('planets').doc(planetId);
    const docSnapshot = await docRef.get();

    const doc = docSnapshot.data() as Planet;

    return doc;
  }

  async getExams(): Promise<IExam[]> {
    const docRef = await this.db.collection('exams').listDocuments();
    const documents = await Promise.all(docRef.map((doc) => doc.get()));

    const exams = documents.map((doc) => doc.data()) as IExam[];

    return exams;
  }
}
