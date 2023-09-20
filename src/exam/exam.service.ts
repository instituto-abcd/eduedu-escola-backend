import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { FirestoreService } from 'src/planet-sync/firestore.service';
import { Exam, IExam, Question } from './schemas/exam.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ca } from 'date-fns/locale';
import { StorageService } from 'src/planet-sync/storage.service';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<Exam>,
    private readonly firestoreService: FirestoreService,
    private readonly storageService: StorageService,
  ) {}

  async getExamQuestions(): Promise<Question[]> {
    const currentExam = await this.examModel.findOne({ status: "ACTIVE" });
    return currentExam.questions;
  }

  async syncExams() {
    try {
      const exams = await this.firestoreService.getExams();
      await this.handleFileURLs(exams);

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

  private async handleFileURLs(exams: IExam[]) {
    for (let index = 0; index < exams.length; index++) {
      for (let questionIndex = 0; questionIndex < exams[index].questions.length; questionIndex++) {
        for (let optionIndex = 0; optionIndex < exams[index].questions[questionIndex].options.length; optionIndex++) {
            let image_name = exams[index].questions[questionIndex].options[optionIndex].image_name;
            let original_image_url = exams[index].questions[questionIndex].options[optionIndex].image_url;
            exams[index].questions[questionIndex].options[optionIndex].image_url = await this.recoverFileURL(image_name, original_image_url);
            let sound_name = exams[index].questions[questionIndex].options[optionIndex].sound_name;
            let original_sound_url = exams[index].questions[questionIndex].options[optionIndex].sound_url;
            exams[index].questions[questionIndex].options[optionIndex].sound_url = await this.recoverFileURL(sound_name, original_sound_url);
        }
        for (let titleIndex = 0; titleIndex < exams[index].questions[questionIndex].titles.length; titleIndex++) {
            let file_name = exams[index].questions[questionIndex].titles[titleIndex].file_name;
            let original_file_url = exams[index].questions[questionIndex].titles[titleIndex].file_url;
            exams[index].questions[questionIndex].titles[titleIndex].file_url = await this.recoverFileURL(file_name, original_file_url);
        }
      }
    }
  }

  private async recoverFileURL(
    id: string | null,
    url: string | null
  ): Promise<string | null> {
    if (id === null || id === undefined || id == '' ||
        url === null || url === undefined || url == '') {
      return '';
    }

    if (process.env.ASSETS !== 'LOCAL') {
      return url;
    }

    const fileExtension = await this.storageService.handleFile('exam', id);
    const fileServerUrl = process.env.FILE_SERVER_URL;
    return `${fileServerUrl}/${id.replace('.mp3','').replace('.mp4','').replace('.svg','')}${fileExtension}`;
  }
}
