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
                score: 80,
                stars: 3.1,
              },
              {
                planetId: uuidv4(),
                planetName: 'Plutão',
                planetAvatar: 'url-to-image',
                score: 100.0,
                stars: 4.5,
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
        const planetTrack: PlanetDto[] = studentExam.planetTrack.map(
          (planet) => ({
            planetId: planet.planetId,
            planetName: planet.planetName,
            planetAvatar: planet.planetAvatar,
            score: planet.score,
            stars: planet.stars,
          }),
        );

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
