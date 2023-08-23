import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StudentExam, StudentExamDocument } from './schemas/studentExam.schema';
import { Model } from 'mongoose';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentPlanetResultDetailDto } from './dto/student-planet-result-detail.dto';
import { PlanetChartStudentResponse } from './dto/response/planet-chart-studant-response.dto';
import { ChartDatasetDto } from './dto/response/chart-dataset-dto';

@Injectable()
export class StudentResultService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

  async getStudentPlanetsResultDetail(
    studentExamId: string,
    loadPlanets: boolean,
  ): Promise<StudentPlanetResultDetailDto[]> {
    const result: StudentPlanetResultDetailDto[] = [];
    const studentExam = await this.studentExamModel.findById(studentExamId);

    result.push(
      await this.getStudentPlanetResultDetail(
        studentExam,
        loadPlanets,
        'ES',
        'Consciência Fonológica',
      ),
    );
    result.push(
      await this.getStudentPlanetResultDetail(
        studentExam,
        loadPlanets,
        'EA',
        'Sistema de Escrita Alfabética',
      ),
    );
    result.push(
      await this.getStudentPlanetResultDetail(
        studentExam,
        loadPlanets,
        'LC',
        'Leitura e Compreensão do Texto',
      ),
    );

    return result;
  }

  private async getStudentPlanetResultDetail(
    studentExam: StudentExamDocument,
    loadPlanets: boolean,
    axisCode: string,
    axisName: string,
  ): Promise<StudentPlanetResultDetailDto> {
    const studentPlanetResult = await this.prisma.studentPlanetResult.findMany({
      where: { studentId: studentExam.studentId, axisCode: axisCode },
    });

    const planetResultDetail = new StudentPlanetResultDetailDto();
    planetResultDetail.axisCode = axisCode;
    planetResultDetail.axisName = axisName;
    planetResultDetail.offeredPlanets = studentExam.planetTrack.filter(
      (item) => item.axis_code == axisCode,
    ).length;
    planetResultDetail.accomplishedPlanets = studentPlanetResult.length;
    const averageStars =
      studentPlanetResult.reduce((a, u) => a + +u.stars, 0) /
      studentPlanetResult.length;
    planetResultDetail.averageStars = !isNaN(averageStars) ? averageStars : 0;
    planetResultDetail.planets =
      /true/.test(loadPlanets.toString()) == true
        ? studentPlanetResult.map((item) => {
            return {
              planetId: item.planetId,
              planetName: item.planetName,
              stars: +item.stars,
            };
          })
        : [];

    return planetResultDetail;
  }

  async planetsChart(id: string): Promise<PlanetChartStudentResponse> {
    const studentResults = await this.prisma.studentPlanetResult.findMany({
      where: {
        studentId: id,
      },
      orderBy: {
        lastExecution: 'desc',
      },
      take: 12,
    });

    const uniqueDates = [
      ...new Set(studentResults.map((result) => result.lastExecution)),
    ];
    uniqueDates.sort();

    const chartDatasets: ChartDatasetDto[] = [];

    for (const axisCode of [
      ...new Set(studentResults.map((result) => result.axisCode)),
    ]) {
      const chartDataset: ChartDatasetDto = {
        label: this.mapAxisCodeToLabel(axisCode), // Map the axisCode to the label
        data: [],
        borderWidth: 2,
      };

      const formattedDates = await Promise.all(
        uniqueDates.map(async (date) => await this.formatDate(date)),
      );

      for (const dateString of formattedDates) {
        const filteredResults = studentResults.filter(
          async (result) =>
            result.axisCode === axisCode &&
            (await this.formatDate(result.lastExecution)) === dateString,
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
      labels: await Promise.all(
        uniqueDates.map(async (date) => await this.formatDate(date)),
      ),
      datasets: chartDatasets,
    };
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

  private async formatDate(date: Date): Promise<string> {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }
}
