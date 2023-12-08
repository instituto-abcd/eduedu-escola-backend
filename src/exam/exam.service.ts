import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { FirestoreService } from 'src/planet-sync/firestore.service';
import { Exam, IExam, Question } from './schemas/exam.schema';
import { InjectModel } from '@nestjs/mongoose';
import { StorageService } from 'src/planet-sync/storage.service';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<Exam>,
    private readonly firestoreService: FirestoreService,
    private readonly storageService: StorageService,
  ) {}

  async getExamQuestions(): Promise<Question[]> {
    const currentExam = await this.examModel.findOne({ status: 'ACTIVE' });
    return currentExam.questions;
  }

  async syncExams() {
    try {
      const _exams = await this.firestoreService.getExams();
      const exams = await this.handleFileURLs(_exams);

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

  private async handleFileURLs(exams: IExam[]): Promise<IExam[]> {
    await this.storageService.initialize();

    const promises = exams.map(async (exam) => {
      const newQuestions = exam.questions.map(async (question) => {
        const newOptions = question.options.map(async (option) => {
          option.image_url = await this.storageService.recoverFileURL(
            option.image_name.toLocaleLowerCase(),
            option.image_url,
            'exam',
          );
          option.sound_url = await this.storageService.recoverFileURL(
            option.sound_name.toLocaleLowerCase(),
            option.sound_url,
            'exam',
          );

          return option;
        });

        question.options = await Promise.all(newOptions);

        const newTitles = question.titles.map(async (title) => {
          title.file_url = await this.storageService.recoverFileURL(
            title.file_name.toLocaleLowerCase(),
            title.file_url,
            'exam',
          );

          return title;
        });

        question.titles = await Promise.all(newTitles);

        return question;
      });

      exam.questions = await Promise.all(newQuestions);
      return exam;
    });

    return await Promise.all(promises);
  }
}
