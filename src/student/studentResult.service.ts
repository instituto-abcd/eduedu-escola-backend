import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StudentExam, StudentExamDocument } from './schemas/studentExam.schema';
import { Model } from 'mongoose';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentPlanetResultDetailDto } from './dto/student-planet-result-detail.dto';
import { ChartStudentResponse } from './dto/response/chart-studant-response.dto';
import { ChartDatasetDto } from './dto/response/chart-dataset-dto';
import { StudentDetailedSummaryDto } from './student-detailed-summary.dto';
import { StudentService } from './student.service';
import { StudentPlanetResult } from '@prisma/client';
import { PerformanceResultUtilsService } from 'src/common/utils/performance-result-utils.service';

@Injectable()
export class StudentResultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentService: StudentService,
    private readonly performanceResultUtilsService: PerformanceResultUtilsService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

  async getStudentDetailedSummary(
    studentId: string,
  ): Promise<StudentDetailedSummaryDto> {
    const result = new StudentDetailedSummaryDto();
    const studentExam = await this.studentExamModel.findOne({
      studentId: studentId,
      current: true,
    });

    const studentExamResults = await this.prisma.studentExamResult.findMany({
      where: { studentId: studentId, examId: studentExam.examId },
    });

    const axisList = [];
    const studentSchoolGradeYear = await this.studentService.getSchoolGradeYear(
      studentId,
    );

    if (studentSchoolGradeYear == 0) {
      axisList.push('ES');
      axisList.push('EA');
    } else {
      axisList.push('ES');
      axisList.push('EA');
    }

    axisList.push('LC');

    axisList.forEach((axisCode) => {
      const studentExamResult = studentExamResults.find(
        (result) => result.axisCode == axisCode,
      );

      let level = studentExamResult ? studentExamResult.level : "0";
      let percent = studentExamResult ? studentExamResult.percent : 0;
      let resume =  studentExamResult ? studentExamResult.resume :
        `Esse aluno ainda não foi avaliado no eixo ${this.mapAxisCodeToLabel(axisCode)}.`;

      let performanceDefinition = this.performanceResultUtilsService
        .getStudentPerformanceDefinition(studentSchoolGradeYear, level);

      result.performanceByArea.push({
        axisCode: axisCode,
        axisName: this.mapAxisCodeToLabel(axisCode),
        percent: +percent,
        description: `${+percent}% ${performanceDefinition.description}`,
        color: performanceDefinition.color
      });

      result.summaries.push({
        axisCode: axisCode,
        summary: resume,
      });
    });

    return result;
  }

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

  async planetsChart(id: string): Promise<ChartStudentResponse> {
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

    const axisList = ['ES', 'EA', 'LC'];

    for (const axisCode of axisList) {
      const chartDataset: ChartDatasetDto = {
        label: this.mapAxisCodeToLabel(axisCode), // Map the axisCode to the label
        data: [],
        borderWidth: 2,
      };

      const formattedDates = [...new Set(uniqueDates.map((date) => this.formatDate(date)))];

      for (const dateString of formattedDates) {
        const filteredResults = studentResults.filter((result) =>
          result.axisCode == axisCode &&
          this.formatDate(result.lastExecution) == dateString,
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
      labels: [...new Set(uniqueDates.map((date) => this.formatDate(date)))],
      datasets: chartDatasets,
    };
  }

  async examsChart(id: string): Promise<ChartStudentResponse> {
    const studentResults = await this.prisma.studentExamResult.findMany({
      where: {
        studentId: id,
      },
      orderBy: {
        examDate: 'desc',
      },
      take: 12,
    });

    const uniqueDates = [
      ...new Set(studentResults.map((result) => result.examDate)),
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

      const formattedDates = uniqueDates.map((date) => this.formatDate(date));

      for (const dateString of formattedDates) {
        const filteredResults = studentResults.filter(
          (result) =>
            result.axisCode === axisCode &&
            (this.formatDate(result.examDate)) === dateString,
        );

        if (filteredResults.length > 0) {
          const totalStars = filteredResults.reduce(
            (sum, result) => sum + Number(result.percent),
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
      labels: uniqueDates.map((date) => this.formatDate(date)),
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

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  async calculatePlanetsChartForClass(
    classId: string,
  ): Promise<ChartStudentResponse> {
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
  ): ChartStudentResponse {
    const uniqueAxisCodes = [
      ...new Set(studentResults.map((result) => result.axisCode)),
    ];
    const uniqueMonths = [
      ...new Set(
        studentResults.map((result) => result.lastExecution.getMonth()),
      ),
    ];

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
}
