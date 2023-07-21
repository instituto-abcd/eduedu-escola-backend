import { Injectable, Logger } from '@nestjs/common';
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
import { DateApiService } from '../common/services/date-api.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApiService: DateApiService,
  ) {}

  private logger = new Logger(DashboardService.name);

  async getDashboard(schoolYear: number): Promise<DashboardDto> {
    try {
      const dashboard = await this.prisma.dashboard.findFirst({
        where: {
          schoolYear: parseInt(schoolYear.toString()),
        },
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

      if (!dashboard) {
        throw new EduException('DASHBOARD_NOT_FOUND');
      }

      const schoolGrades: SchoolGradeDto[] = await Promise.all(
        dashboard.dashboardSchoolGrades.map(async (grade) => {
          const schoolClasses = await this.getSchoolClassesByGrade(grade.id);
          const mappedSchoolClasses = await Promise.all(
            schoolClasses.map(async (schoolClass) =>
              this.mapSchoolClassDto(schoolClass),
            ),
          );

          return {
            name: grade.name,
            teachersCounter: grade.teachersCounter,
            schoolClassesCounter: grade.schoolClassesCounter,
            studentsCounter: grade.studentsCounter,
            schoolClasses: mappedSchoolClasses,
          };
        }),
      );

      return {
        schoolYear: dashboard.schoolYear,
        teachersCounter: dashboard.teachersCounter,
        schoolClassesCounter: dashboard.schoolClassesCounter,
        studentsCounter: dashboard.studentsCounter,
        schoolGrades,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new EduException('DATABASE_ERROR');
      } else {
        throw new EduException('UNKNOWN_ERROR');
      }
    }
  }

  private async mapSchoolClassDto(schoolClass): Promise<SchoolClassDto> {
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
    try {
      const dashboard = await this.prisma.dashboard.create({
        data: {
          id: uuidv4(),
          schoolYear: schoolYear,
          teachersCounter: 0,
          schoolClassesCounter: 0,
          studentsCounter: 0,
        },
      });

      await this.createDashboardSchoolGrade(
        uuidv4(),
        SchoolGradeEnum.CHILDREN,
        dashboard.id,
      );
      await this.createDashboardSchoolGrade(
        uuidv4(),
        SchoolGradeEnum.FIRST_GRADE,
        dashboard.id,
      );
      await this.createDashboardSchoolGrade(
        uuidv4(),
        SchoolGradeEnum.SECOND_GRADE,
        dashboard.id,
      );
      await this.createDashboardSchoolGrade(
        uuidv4(),
        SchoolGradeEnum.THIRD_GRADE,
        dashboard.id,
      );
    } catch (error) {
      this.logger.log('Error creating school year:', error);
    }
  }

  private async createDashboardSchoolGrade(
    id: string,
    name: SchoolGradeEnum,
    dashboardId: string,
  ): Promise<void> {
    try {
      await this.prisma.dashboardSchoolGrade.create({
        data: {
          id,
          name,
          teachersCounter: 0,
          schoolClassesCounter: 0,
          studentsCounter: 0,
          dashboardId,
        },
      });
    } catch (error) {
      this.logger.log('Error creating dashboard school grade:', error);
    }
  }

  async createSchoolClass(
    schoolClassId: string,
    nameSchoolClass: string,
    grade: SchoolGradeEnum,
  ): Promise<void> {
    const studentsCounter = 0;

    try {
      const dashboardGrade = await this.prisma.dashboardSchoolGrade.findFirst({
        where: { name: grade },
        include: { dashboardSchoolClass: true },
      });

      if (!dashboardGrade) {
        this.logger.log(`Dashboard School Grade not found for name: ${grade}`);
      }

      const data = {
        id: schoolClassId,
        name: nameSchoolClass,
        studentsCounter: studentsCounter,
        dashboardGrade: { connect: { id: dashboardGrade.id } },
      };

      await this.prisma.dashboardSchoolClass.create({
        data,
      });
    } catch (error) {
      this.logger.log('Error creating school class:', error);
    }
  }

  async getSchoolClassesByGrade(dashboardGradeId: string): Promise<any[]> {
    try {
      return this.prisma.dashboardSchoolClass.findMany({
        where: {
          dashboardGradeId,
        },
        include: {
          dashboardPerformances: true,
        },
      });
    } catch (error) {
      this.logger.log('Error getting school classes by grade:', error);
    }
  }

  async updateDashboardData(schoolYear?: number) {
    try {
      if (schoolYear == null) {
        schoolYear = await this.externalApiService.getCurrentYear();
      }

      const dashboardId = await this.getDashboardId(schoolYear);

      const teachersCounter = await this.prisma.userSchoolClass.count({
        where: {
          schoolClass: {
            schoolYear: {
              name: schoolYear,
            },
          },
        },
      });

      const schoolClassesCounter = await this.prisma.schoolClass.count({
        where: {
          schoolYear: {
            name: schoolYear,
          },
        },
      });

      const studentsCounter = await this.prisma.schoolClassStudent.count({
        where: {
          schoolClass: {
            schoolYear: {
              name: schoolYear,
            },
          },
        },
      });

      const dashboard = await this.prisma.dashboard.upsert({
        where: { id: dashboardId },
        update: {
          teachersCounter,
          schoolClassesCounter,
          studentsCounter,
        },
        create: {
          schoolYear,
          teachersCounter,
          schoolClassesCounter,
          studentsCounter,
        },
      });

      for (const grade of Object.values(SchoolGradeEnum)) {
        const gradeId = await this.getDashboardSchoolGradeId(
          grade,
          dashboard.id,
        );

        const teachersCounterGrade = await this.prisma.userSchoolClass.count({
          where: {
            schoolClass: {
              schoolYear: {
                name: schoolYear,
              },
              schoolGrade: grade,
            },
          },
        });

        const schoolClassesCounterGrade = await this.prisma.schoolClass.count({
          where: {
            schoolYear: {
              name: schoolYear,
            },
            schoolGrade: grade,
          },
        });

        const studentsCounterGrade = await this.prisma.schoolClassStudent.count(
          {
            where: {
              schoolClass: {
                schoolYear: {
                  name: schoolYear,
                },
                schoolGrade: grade,
              },
            },
          },
        );

        await this.prisma.dashboardSchoolGrade.upsert({
          where: { id: gradeId },
          update: {
            teachersCounter: teachersCounterGrade,
            schoolClassesCounter: schoolClassesCounterGrade,
            studentsCounter: studentsCounterGrade,
          },
          create: {
            name: grade,
            teachersCounter: teachersCounterGrade,
            schoolClassesCounter: schoolClassesCounterGrade,
            studentsCounter: studentsCounterGrade,
            dashboard: {
              connect: {
                id: dashboard.id,
              },
            },
          },
        });
      }

      const schoolClasses = await this.prisma.schoolClass.findMany({
        where: {
          schoolYear: {
            name: schoolYear,
          },
        },
      });

      for (const schoolClass of schoolClasses) {
        const studentsCounterClass = await this.prisma.schoolClassStudent.count(
          {
            where: {
              schoolClass: {
                id: schoolClass.id,
              },
            },
          },
        );

        const dashboardSchoolGrade =
          await this.prisma.dashboardSchoolGrade.findFirst({
            where: {
              name: schoolClass.schoolGrade,
              dashboardId: dashboard.id,
            },
          });

        if (dashboardSchoolGrade) {
          await this.prisma.dashboardSchoolClass.upsert({
            where: { id: schoolClass.id },
            update: {
              studentsCounter: studentsCounterClass,
            },
            create: {
              name: schoolClass.name,
              studentsCounter: studentsCounterClass,
              dashboardGrade: {
                connect: {
                  id: dashboardSchoolGrade.id,
                },
              },
            },
          });
        }
      }
    } catch (error) {
      this.logger.log('Error updating dashboard data:', error);
    }
  }

  async updateDashboardDataArray(schoolYears: number[]) {
    try {
      for (const schoolYear of schoolYears) {
        await this.updateDashboardData(schoolYear);
      }
    } catch (error) {
      this.logger.log('Error updating dashboard data:', error);
    }
  }

  async getDashboardId(schoolYear: number): Promise<string | null> {
    try {
      const dashboard = await this.prisma.dashboard.findFirst({
        where: {
          schoolYear: {
            equals: schoolYear,
          },
        },
      });

      return dashboard ? dashboard.id : null;
    } catch (error) {
      this.logger.log('Error getting dashboard ID:', error);
    }
  }

  async getDashboardSchoolGradeId(
    grade: SchoolGradeEnum,
    dashboardId: string,
  ): Promise<string | null> {
    try {
      const dashboardSchoolGrade =
        await this.prisma.dashboardSchoolGrade.findFirst({
          where: {
            AND: [
              {
                name: {
                  equals: grade,
                },
              },
              {
                dashboard: {
                  id: {
                    equals: dashboardId,
                  },
                },
              },
            ],
          },
        });

      return dashboardSchoolGrade ? dashboardSchoolGrade.id : null;
    } catch (error) {
      this.logger.log('Error getting dashboard school grade ID:', error);
    }
  }
}
