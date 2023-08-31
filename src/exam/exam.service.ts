import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { FirestoreService } from 'src/planet-sync/firestore.service';
import { Exam, Question } from './schemas/exam.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ca } from 'date-fns/locale';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<Exam>,
    private readonly firestoreService: FirestoreService,
  ) {}

  async getExamQuestions(): Promise<Question[]> {
    const currentExam = await this.examModel.findOne({ status: "ACTIVE" });
    return currentExam.questions;
  }

  async syncExams() {
    try {
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
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
