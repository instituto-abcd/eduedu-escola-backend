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

@Injectable()
export class SchoolClassResultService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

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
