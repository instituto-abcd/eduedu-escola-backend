import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentExam, StudentExamDocument } from './schemas/studentExam.schema';
import { v4 as uuidv4 } from 'uuid';
import { EduException } from '../common/exceptions/edu-school.exception';
import { PlanetTrackDto } from './dto/planet-track.dto';
import { PlanetDto } from './dto/planet.dto';
import { StudentExamDto } from './dto/studentexam.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudentExamService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

  async getStudentExams(studentId: string): Promise<StudentExamDto[]> {
    const studentExams = await this.studentExamModel.find({ studentId, examPerformed: true });
    const result: StudentExamDto[] = studentExams.map((item) => {
      return  { id: item.id, examDate: item.examDate };
    });
    return result;
  }

  async getPlanetTrack(
    studentId: string,
    usePlanetAvailability: boolean = true,
  ): Promise<PlanetTrackDto> {
    try {
      const studentExam = await this.studentExamModel
        .findOne({ studentId, lastExam: true });

      if (!studentExam) {
        throw new EduException('STUDENT_NOT_FOUND');
      }

      studentExam.planetTrack = studentExam.planetTrack.sort((a: any, b: any) => {
        if (a.order < b.order) return -1;
        if (a.order > b.order) return 1;
        return 0;
      });

      let studentPlanetResult = await this.prisma.studentPlanetResult.findMany({
        where: {
          studentId: studentId,
          studentExamId: studentExam.id,
        }
      });

      let planetTrack: PlanetDto[] = [];
      for (let index = 0; index < studentExam.planetTrack.length; index++) {
        let currentPlanetResult = studentPlanetResult.find((item) =>
          item.planetId === studentExam.planetTrack[index].planetId
        );
        let currentPlanetStars = currentPlanetResult ? parseFloat(currentPlanetResult.stars.toString()) : 0;

        let previousPlanetResult =
          index > 0
            ? studentPlanetResult.find((item) => item.planetId === studentExam.planetTrack[index - 1].planetId)
            : undefined;
        let previousPlanetStars = previousPlanetResult ? parseFloat(previousPlanetResult.stars.toString()) : 0;

        // Determina se o planeta atual deve estar habilitado
        let enable = index === 0 || currentPlanetStars > 0 || previousPlanetStars > 0;

        let canExecutePlanet = enable;
        if (usePlanetAvailability) {
          let planetAvailable =
            studentExam.planetTrack[index].availableAt != undefined &&
            studentExam.planetTrack[index].availableAt <= new Date();
          canExecutePlanet &&= planetAvailable;
        }

        const planetDto = {
          planetId: studentExam.planetTrack[index].planetId,
          planetName: studentExam.planetTrack[index].planetName,
          planetAvatar: studentExam.planetTrack[index].planetAvatar,
          stars: currentPlanetStars,
          enable,
          canExecutePlanet,
        };

        planetTrack.push(planetDto);

        if (!enable && !canExecutePlanet) {
          break;
        }
      }

      return {
        examPerformed: studentExam.examPerformed,
        studentId: studentExam.studentId,
        examId: studentExam.examId,
        examDate: studentExam.examDate,
        current: studentExam.current,
        planetTrack,
      };
    } catch (error) {
      throw error;
    }
  }

  async getExamPerformedStatusByStudentId(studentId: string): Promise<boolean> {
    try {
      const result = await this.studentExamModel
        .findOne({ studentId, current: true });

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
