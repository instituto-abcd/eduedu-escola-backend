import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { FirestoreService } from 'src/planet-sync/firestore.service';
import { Exam } from './schemas/exam.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<Exam>,
    private readonly firestoreService: FirestoreService,
  ) {}

  async syncExams() {
    const exams = await this.firestoreService.getExams();
    const mutation = await this.examModel.bulkWrite(
      exams.map((exam) => ({
        updateOne: {
          filter: { id: exam.id },
          update: exam,
          upsert: true,
        },
      })),
    );

    return {
      success: mutation.isOk(),
      examsSynced: mutation.upsertedCount,
      examsUpdated: mutation.modifiedCount,
    };
  }
}
