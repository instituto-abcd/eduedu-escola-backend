import { Injectable } from '@nestjs/common';
import { Prisma, SchoolGradeEnum } from '@prisma/client';
import {
  DashboardDto,
  ExamPerformanceDto,
  PlanetPerformanceDto,
  SchoolClassDto,
  SchoolGradeDto,
} from './dto/dashboard.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<DashboardDto[]> {
    try {
      const dashboards = await this.prisma.dashboard.findMany({
        include: {
          dashboardSchoolGrades: {
            include: {
              dashboardSchoolClass: {
                include: {
                  dashboardPerformances: true,
                },
              },
            },
          },
        },
      });

      if (!dashboards || dashboards.length === 0) {
        throw new EduException('DASHBOARD_NOT_FOUND');
      }

      return dashboards.map((dashboard) => {
        const schoolGrades: SchoolGradeDto[] =
          dashboard.dashboardSchoolGrades.map((grade) => ({
            name: grade.name,
            teachersCounter: grade.teachersCounter,
            schoolClassesCounter: grade.schoolClassesCounter,
            studentsCounter: grade.studentsCounter,
            schoolClasses: grade.dashboardSchoolClass.map((schoolClass) =>
              this.mapSchoolClassDto(schoolClass),
            ),
          }));

        return {
          schoolYear: dashboard.schoolYear,
          teachersCounter: dashboard.teachersCounter,
          schoolClassesCounter: dashboard.schoolClassesCounter,
          studentsCounter: dashboard.studentsCounter,
          schoolGrades,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new EduException('DATABASE_ERROR');
      } else {
        throw new EduException('UNKNOWN_ERROR');
      }
    }
  }

  private mapSchoolClassDto(schoolClass): SchoolClassDto {
    if (!schoolClass || !schoolClass.dashboardPerformances) {
      throw new EduException('INVALID_DATA');
    }

    const examPerformance: ExamPerformanceDto[] =
      schoolClass.dashboardPerformances
        .filter((performance) => performance.type === 'EXAM')
        .map((performance) => ({
          axis: performance.axis,
          percentage: performance.percentage,
        }));

    const planetPerformance: PlanetPerformanceDto[] =
      schoolClass.dashboardPerformances
        .filter((performance) => performance.type === 'PLANET')
        .map((performance) => ({
          axis: performance.axis,
          percentage: performance.percentage,
        }));

    return {
      name: schoolClass.name,
      studentsCounter: schoolClass.studentsCounter,
      examPerformance,
      planetPerformance,
    };
  }

  async createSchoolYear(schoolYear: number): Promise<void> {
    const dashboard = await this.prisma.dashboard.create({
      data: {
        id: uuidv4(),
        schoolYear: schoolYear,
        teachersCounter: 0,
        schoolClassesCounter: 0,
        studentsCounter: 0,
      },
    });

    const firstChildren = await this.prisma.dashboardSchoolGrade.create({
      data: {
        id: uuidv4(),
        name: SchoolGradeEnum.CHILDREN,
        teachersCounter: 0,
        schoolClassesCounter: 0,
        studentsCounter: 0,
        dashboardId: dashboard.id,
      },
    });

    const firstGrade = await this.prisma.dashboardSchoolGrade.create({
      data: {
        id: uuidv4(),
        name: SchoolGradeEnum.FIRST_GRADE,
        teachersCounter: 0,
        schoolClassesCounter: 0,
        studentsCounter: 0,
        dashboardId: dashboard.id,
      },
    });

    const secondGrade = await this.prisma.dashboardSchoolGrade.create({
      data: {
        id: uuidv4(),
        name: SchoolGradeEnum.SECOND_GRADE,
        teachersCounter: 0,
        schoolClassesCounter: 0,
        studentsCounter: 0,
        dashboardId: dashboard.id,
      },
    });

    const thirdGrade = await this.prisma.dashboardSchoolGrade.create({
      data: {
        id: uuidv4(),
        name: SchoolGradeEnum.THIRD_GRADE,
        teachersCounter: 0,
        schoolClassesCounter: 0,
        studentsCounter: 0,
        dashboardId: dashboard.id,
      },
    });
  }
}
