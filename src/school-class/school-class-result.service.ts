import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  SchoolGradeEnum,
  StudentExamResult,
  StudentPlanetResult,
} from '@prisma/client';
import {
  StudentExam,
  StudentExamDocument,
} from '../student/schemas/studentExam.schema';
import { ChartStudentResponse } from '../student/dto/response/chart-studant-response.dto';
import { ChartDatasetDto } from '../student/dto/response/chart-dataset-dto';
import { SchoolClassPlanetResultDetailDto } from './dto/response/school-class-planet-result-detail.dto';
import {
  ClassificationDetailedSummaryDto,
  SchoolClassDetailedSummaryDto,
} from './dto/response/school-class-detailed-summary.dto';
import { PerformanceResultUtilsService } from 'src/common/utils/performance-result-utils.service';
import { PlanetPerformanceResponse } from './dto/response/planet-performance.response';
import { ExamPerformanceResponse } from './dto/response/exam-performance.response';

@Injectable()
export class SchoolClassResultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly performanceResultUtilsService: PerformanceResultUtilsService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

  async getSchoolClassDetailedSummary(
    schoolClassId: string,
  ): Promise<SchoolClassDetailedSummaryDto[]> {
    const result: SchoolClassDetailedSummaryDto[] = [];

    const students = await this.prisma.student.findMany({
      where: {
        schoolClasses: {
          some: {
            schoolClassId: schoolClassId,
            active: true,
          },
        },
      },
      include: {
        examResults: true,
      },
    });

    const studentIds = students.map((item) => item.id);
    const studentExams = await this.studentExamModel.find({
      studentId: { $in: studentIds },
      current: true,
    });

    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: schoolClassId },
      include: {
        schoolYear: true,
      },
    });

    const schoolGradeYear = Object.keys(SchoolGradeEnum).indexOf(
      schoolClass.schoolGrade,
    );

    const axisList = ['ES', 'EA', 'LC'];
    axisList.forEach((axisCode) => {
      const studentsParsed: any[] = students.map((student: any) => {
        const studentExam = studentExams.find(
          (item) => item.studentId == student.id,
        );
        const studentExamResult = student.examResults.find(
          (item) =>
            item.examId == studentExam.examId && item.axisCode == axisCode,
        );
        const classification =
          this.performanceResultUtilsService.getStudentPerformanceDefinition(
            schoolGradeYear,
            studentExamResult.level,
          );
        student.classification = classification.description;
        student.examDate = studentExamResult.examDate;
        student.percent = studentExamResult.percent;
        return student;
      });

      const examResultDetail = new SchoolClassDetailedSummaryDto();
      examResultDetail.axisCode = axisCode;
      examResultDetail.axisName = this.mapAxisCodeToLabel(axisCode);

      examResultDetail.veryLow = new ClassificationDetailedSummaryDto();
      examResultDetail.veryLow.students = studentsParsed
        .filter((student: any) => student.classification == 'Muito abaixo')
        .map((student) => {
          return {
            studentId: student.id,
            name: student.name,
            lastExamDate: student.examDate,
            percent: student.percent,
          };
        });
      examResultDetail.veryLow.count = examResultDetail.veryLow.students.length;

      examResultDetail.below = new ClassificationDetailedSummaryDto();
      examResultDetail.below.students = studentsParsed
        .filter((student: any) => student.classification == 'Abaixo')
        .map((student) => {
          return {
            studentId: student.id,
            name: student.name,
            lastExamDate: student.examDate,
            percent: student.percent,
          };
        });
      examResultDetail.below.count = examResultDetail.below.students.length;

      examResultDetail.expected = new ClassificationDetailedSummaryDto();
      examResultDetail.expected.students = studentsParsed
        .filter((student: any) => student.classification == 'Esperado')
        .map((student) => {
          return {
            studentId: student.id,
            name: student.name,
            lastExamDate: student.examDate,
            percent: student.percent,
          };
        });
      examResultDetail.expected.count =
        examResultDetail.expected.students.length;

      result.push(examResultDetail);
    });

    return result;
  }

  async getSchoolClassPlanetResultDetail(
    schoolClassId: string,
  ): Promise<SchoolClassPlanetResultDetailDto[]> {
    const result: SchoolClassPlanetResultDetailDto[] = [];

    const students = await this.prisma.student.findMany({
      where: {
        schoolClasses: {
          some: {
            schoolClassId: schoolClassId,
            active: true,
          },
        },
      },
    });

    const studentIds = students.map((item) => item.id);

    const studentExams = await this.studentExamModel.find({
      studentId: { $in: studentIds },
      current: true,
    });
    const planetTrackList = studentExams.reduce(
      (pt, s) => [...pt, ...s.planetTrack],
      [],
    );

    const studentPlanetResults = await this.prisma.studentPlanetResult.findMany(
      {
        where: { studentId: { in: studentIds } },
      },
    );

    const axisList = ['ES', 'EA', 'LC'];
    axisList.forEach((axisCode) => {
      const planetResultDetail = new SchoolClassPlanetResultDetailDto();
      const axisStudentPlanetResults = studentPlanetResults.filter(
        (item) => item.axisCode == axisCode,
      );

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

  async getChartByPlanetsForSchoolClass(
    classId: string,
  ): Promise<ChartStudentResponse> {
    const studentResults = await this.retrieveStudentResultsPlanets(classId);
    return this.calculateChartByPlanet(studentResults);
  }

  async retrieveStudentResultsPlanets(
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

  private calculateChartByPlanet(
    studentResults: StudentPlanetResult[],
  ): ChartStudentResponse {
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

  async getChartByExamForSchoolClass(
    classId: string,
  ): Promise<ChartStudentResponse> {
    const studentResults = await this.retrieveStudentResultsExams(classId);
    return this.calculateChartByExam(studentResults);
  }

  private calculateChartByExam(
    studentResults: StudentExamResult[],
  ): ChartStudentResponse {
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
            result.examDate.getMonth() === month,
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
      labels: uniqueMonths.map((month) => this.mapMonthToLabel(month)),
      datasets: chartDatasets,
    };
  }

  async retrieveStudentResultsExams(
    idSchoolClass: string,
  ): Promise<StudentExamResult[]> {
    return this.prisma.studentExamResult.findMany({
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
        examDate: 'desc',
      },
    });
  }

  async examsPerformanceStudents(
    idSchoolClass: string,
  ): Promise<ExamPerformanceResponse[]> {
    const students = await this.getStudentBySchoolClasses(idSchoolClass);
    const studentIds = students.map((student) => student.id);
    const filteredStudentExamResults = await this.getFilteredStudentExamResults(
      studentIds,
    );

    const studentsWithResults = students.filter((student) =>
      filteredStudentExamResults.some(
        (result) => result.studentId === student.id,
      ),
    );

    studentsWithResults.map((student) => {
      filteredStudentExamResults.filter(
        (result) => result.studentId === student.id && result.examId !== null,
      );
    });

    const resultsByStudent: {
      [studentId: string]: {
        [axisCode: string]: { examDate: Date; [key: string]: any };
      };
    } = {};

    filteredStudentExamResults.forEach((result) => {
      if (!resultsByStudent[result.studentId])
        resultsByStudent[result.studentId] = {};
      resultsByStudent[result.studentId][result.axisCode] = {
        ...result,
        examDate: result.examDate,
      };
    });

    return studentsWithResults.map((student) => {
      const getPerformanceResult = (axisCode: string, defaultPercent = '0') => {
        const result = resultsByStudent[student.id]?.[axisCode];
        return (result ? result.percent : defaultPercent) + '%';
      };

      const schoolGradeYear = Object.keys(SchoolGradeEnum).indexOf(
        student.schoolClasses[0].schoolClass.schoolGrade,
      );
      const classification =
        this.performanceResultUtilsService.getStudentPerformanceDefinition(
          schoolGradeYear,
          resultsByStudent[student.id]?.['ES']?.level || '0',
        );

      const examDates = [
        resultsByStudent[student.id]?.['ES']?.examDate,
        resultsByStudent[student.id]?.['EA']?.examDate,
        resultsByStudent[student.id]?.['LC']?.examDate,
      ];

      const validExamDates = examDates.filter(
        (date) => date instanceof Date && !isNaN(date.getTime()),
      );
      const timestamps = validExamDates.map((date) => date.getTime());

      const maxTimestamp = Math.max(...timestamps);
      const lastExamDate = new Date(maxTimestamp);
      const lastExamString = this.formatDate(lastExamDate);

      return {
        studentId: student.id,
        studentName: student.name,
        lastExamDate: lastExamString,
        cfo: {
          percent: getPerformanceResult('ES'),
          color: classification.color,
        },
        sea: {
          percent: getPerformanceResult('EA'),
          color: classification.color,
        },
        lct: {
          percent: getPerformanceResult('LC'),
          color: classification.color,
        },
      };
    });
  }

  async getFilteredStudentExamResults(studentIds: string[]) {
    return this.prisma.studentExamResult.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
        examDate: {
          not: undefined,
        },
      },
    });
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  private async getStudentBySchoolClasses(schoolClassesId: string) {
    return this.prisma.student.findMany({
      include: {
        schoolClasses: {
          where: {
            AND: [{ schoolClassId: schoolClassesId }],
          },
          include: {
            schoolClass: {
              include: {
                schoolYear: true,
              },
            },
          },
        },
      },
    });
  }

  async getSchoolGradeYear(studentId: string): Promise<number> {
    const student = await this.getStudent(studentId);
    const schoolGradeYear = student.schoolClasses[0].schoolClass.schoolGrade;
    return Object.keys(SchoolGradeEnum).indexOf(schoolGradeYear);
  }

  private async getStudent(studentId: string) {
    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        schoolClasses: {
          include: {
            schoolClass: {
              include: {
                schoolYear: true,
              },
            },
          },
          where: { active: true },
        },
      },
    });
  }

  async schoolClassPerformancePlanets(
    id: string,
  ): Promise<PlanetPerformanceResponse[]> {
    return null;
  }
}
