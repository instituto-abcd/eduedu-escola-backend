import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentPlanetResult } from '@prisma/client';
import {
  StudentExam,
  StudentExamDocument,
} from '../student/schemas/studentExam.schema';
import { PlanetChartStudentResponse } from '../student/dto/response/planet-chart-studant-response.dto';
import { ChartDatasetDto } from '../student/dto/response/chart-dataset-dto';
import { SchoolClassPlanetResultDetailDto } from './dto/response/school-class-planet-result-detail.dto';

@Injectable()
export class SchoolClassResultService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

  async getSchoolClassPlanetResultDetail(
    schoolClassId: string,
  ): Promise<SchoolClassPlanetResultDetailDto[]> {
    let result: SchoolClassPlanetResultDetailDto[] = [];
    
    let students = await this.prisma.student.findMany({
      where: {
        schoolClasses: {
          some: {
            schoolClassId: schoolClassId,
            active: true,
          },
        },
      }
    });

    let studentIds = students.map((item) => item.id);

    let studentExams = await this.studentExamModel.find({ studentId: { $in: studentIds }, current: true });
    let planetTrackList = studentExams.reduce((pt, s) => [ ...pt, ...s.planetTrack ], []);

    let studentPlanetResults = await this.prisma.studentPlanetResult.findMany({
      where: { studentId: { in: studentIds } },
    });

    const axisList = ['ES', 'EA', 'LC'];
    axisList.forEach((axisCode) => {
      const planetResultDetail = new SchoolClassPlanetResultDetailDto();
      let axisStudentPlanetResults = studentPlanetResults.filter(
        (item) => item.axisCode == axisCode);

      planetResultDetail.axisCode = axisCode;
      planetResultDetail.axisName = this.mapAxisCodeToLabel(axisCode);
      planetResultDetail.offeredPlanets = planetTrackList.filter(
        (item) => item.axis_code == axisCode,
      ).length;
      planetResultDetail.accomplishedPlanets = axisStudentPlanetResults.length;
      const averageStars =
        axisStudentPlanetResults.reduce((a, u) => a + +u.stars, 0) /
        axisStudentPlanetResults.length;
      planetResultDetail.averageStars = !isNaN(averageStars) ? averageStars : 0;

      result.push(planetResultDetail);
    });

    return result;
  }

  async calculatePlanetsChartForClass(
    classId: string,
  ): Promise<PlanetChartStudentResponse> {
    const studentResults = await this.retrieveStudentResults(classId);
    return this.calculateChartResponse(studentResults);
  }

  async retrieveStudentResults(
    idSchoolClass: string,
  ): Promise<StudentPlanetResult[]> {
    return this.prisma.studentPlanetResult.findMany({
      where: {
        student: {
          schoolClasses: {
            some: {
              schoolClassId: idSchoolClass,
              active: true,
            },
          },
        },
      },
      orderBy: {
        lastExecution: 'desc',
      },
    });
  }

  private calculateChartResponse(
    studentResults: StudentPlanetResult[],
  ): PlanetChartStudentResponse {
    const uniqueAxisCodes = [
      ...new Set(studentResults.map((result) => result.axisCode)),
    ];
    const uniqueMonths = Array.from({ length: 12 }, (_, month) => month);

    const chartDatasets: ChartDatasetDto[] = [];

    for (const axisCode of uniqueAxisCodes) {
      const chartDataset: ChartDatasetDto = {
        label: this.mapAxisCodeToLabel(axisCode),
        data: [],
        borderWidth: 2,
      };

      for (const month of uniqueMonths) {
        const filteredResults = studentResults.filter(
          (result) =>
            result.axisCode === axisCode &&
            result.lastExecution.getMonth() === month,
        );

        if (filteredResults.length > 0) {
          const totalStars = filteredResults.reduce(
            (sum, result) => sum + Number(result.stars),
            0,
          );

          const averageStars = totalStars / filteredResults.length;
          chartDataset.data.push(averageStars);
        } else {
          chartDataset.data.push(0);
        }
      }

      chartDatasets.push(chartDataset);
    }

    return {
      labels: uniqueMonths.map((month) => this.mapMonthToLabel(month)),
      datasets: chartDatasets,
    };
  }

  private mapMonthToLabel(month: number): string {
    const monthLabels = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    return monthLabels[month];
  }

  private mapAxisCodeToLabel(axisCode: string): string {
    switch (axisCode) {
      case 'LC':
        return 'Leitura e Compreensão do Texto';
      case 'EA':
        return 'Sistema de Escrita Alfabética';
      case 'ES':
        return 'Consciência Fonológica';
      default:
        return axisCode;
    }
  }
}
