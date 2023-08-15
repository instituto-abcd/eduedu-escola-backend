import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentExam, StudentExamDocument } from './schemas/studentExam.schema';
import { v4 as uuidv4 } from 'uuid';
import { EduException } from '../common/exceptions/edu-school.exception';
import { PlanetTrackDto } from './dto/planet-track.dto';
import { PlanetDto } from './dto/planet.dto';

@Injectable()
export class StudentExamService implements OnModuleInit {
  constructor(
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.studentExamModel.countDocuments();
      if (count === 0) {
        const mockData: StudentExam[] = [
          {
            studentId: uuidv4(),
            examId: uuidv4(),
            examDate: new Date(),
            current: true,
            examPerformed: true,
            planetTrack: [
              {
                planetId: uuidv4(),
                planetName: 'Saturno',
                planetAvatar: 'url-to-image',
                score: '80',
                stars: '3.1',
                axis_code: 'LC',
                order: 1
              },
              {
                planetId: uuidv4(),
                planetName: 'Plutão',
                planetAvatar: 'url-to-image',
                score: '100.0',
                stars: '4.5',
                axis_code: 'ES',
                order: 2
              },
            ],
            answers: [],
          },
        ];
        await this.studentExamModel.create(mockData);
      }
    } catch (error) {
      throw error;
    }
  }

  async getPlanetTrack(studentId: string): Promise<PlanetTrackDto> {
    try {
      const studentExam = await this.studentExamModel
        .findOne({ studentId, current: true })
        .select('studentId examId examDate current planetTrack examPerformed')
        .exec();

      if (studentExam) {
        studentExam.planetTrack = studentExam.planetTrack.sort((a: any, b: any) => {
          if (a.order < b.order) return -1;
          if (a.order > b.order) return 1;
          return 0;
        });

        let planetTrack: PlanetDto[] = [];
        for (let index = 0; index < studentExam.planetTrack.length; index++) {
          const planetDto = {
            planetId: studentExam.planetTrack[index].planetId,
            planetName: studentExam.planetTrack[index].planetName,
            planetAvatar: studentExam.planetTrack[index].planetAvatar,
            score: parseFloat(studentExam.planetTrack[index].score.toString()),
            stars: parseFloat(studentExam.planetTrack[index].stars.toString()),
            canExecutePlanet:
              index === 0 || // O planeta é o primeiro da trilha
              parseFloat(studentExam.planetTrack[index].stars.toString()) > 1 || // O planeta já foi realizado com pelo menos uma estrela
              (index > 0 && parseFloat(studentExam.planetTrack[index - 1].stars.toString()) >= 1) // O planeta anterior já foi realizado com pelo menos uma estrela
          } as PlanetDto;
          planetTrack.push(planetDto);
        }

        return {
          examPerformed: studentExam.examPerformed,
          studentId: studentExam.studentId,
          examId: studentExam.examId,
          examDate: studentExam.examDate,
          current: studentExam.current,
          planetTrack,
        };
      }

      throw new EduException('STUDENT_NOT_FOUND');
    } catch (error) {
      throw error;
    }
  }

  async getExamPerformedStatusByStudentId(studentId: string): Promise<boolean> {
    try {
      const result = await this.studentExamModel
        .findOne({ studentId, current: true })
        .select('examPerformed')
        .exec();

      console.log('Result:', result);

      if (result && result.examPerformed !== null) {
        return Boolean(result.examPerformed);
      }

      return false;
    } catch (error) {
      console.error('Error fetching exam performed status:', error.message);
      return false;
    }
  }
}
