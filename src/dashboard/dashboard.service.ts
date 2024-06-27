import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Profile, SchoolGradeEnum } from '@prisma/client';
import {
  DashboardDto,
  SchoolClassDto,
  SchoolGradeDto,
} from './dto/dashboard.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { DateApiService } from '../common/services/date-api.service';
import { PerformanceResultUtilsService } from '../common/utils/performance-result-utils.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApiService: DateApiService,
    private readonly performanceResultUtilsService: PerformanceResultUtilsService,
  ) { }

  private logger = new Logger(DashboardService.name);

  async getDashboard(schoolYear: number, user: any): Promise<DashboardDto> {
    try {
      let dashboard;

      if (user.profile !== Profile.DIRECTOR) {
        const classIds = await this.userClasses(user.id);

        const schoolYearStr = schoolYear.toString();
        const schoolYearInt = parseInt(schoolYearStr);

        if (classIds.length > 0) {
          dashboard = await this.prisma.dashboard.findFirst({
            where: {
              schoolYear: schoolYearInt,
            },
            include: {
              dashboardSchoolGrades: {
                where: {
                  dashboardSchoolClass: {
                    some: {
                      id: {
                        in: classIds,
                      },
                    },
                  },
                },
                include: {
                  dashboardSchoolClass: {
                    where: {
                      id: {
                        in: classIds,
                      },
                    },
                    include: {
                      dashboardPerformances: true,
                    },
                  },
                },
              },
            },
          });
        }
      } else {
        dashboard = await this.prisma.dashboard.findFirst({
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
      }

      if (!dashboard) {
        throw new EduException('DASHBOARD_NOT_FOUND');
      }

      // Mapeia os dados para o formato desejado
      const schoolGrades: SchoolGradeDto[] = await Promise.all(
        dashboard.dashboardSchoolGrades.map(async (grade) => {
          const mappedSchoolClasses = await Promise.all(
            grade.dashboardSchoolClass.map(async (schoolClass) =>
              this.mapSchoolClassDto(schoolClass),
            ),
          );

          return {
            id: grade.id,
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

  async userClasses(userId: string): Promise<string[]> {
    const uniqueClassIds = await this.prisma.userSchoolClass.findMany({
      where: { userId },
      select: { schoolClassId: true },
      distinct: ['schoolClassId'],
    });

    return uniqueClassIds.map(({ schoolClassId }) => schoolClassId);
  }

  private async mapSchoolClassDto(schoolClass): Promise<SchoolClassDto> {
    if (!schoolClass || !schoolClass.dashboardPerformances) {
      throw new EduException('INVALID_DATA');
    }

    const schoolClassEntity = await this.prisma.schoolClass.findFirst({
      where: { id: schoolClass.schoolGrade },
    });

    // Objeto para armazenar performances de exame e planetas agrupadas por eixo
    const performancesMap = {
      examPerformances: [],
      planetPerformances: {
        ES: { axis: 'ES', percentage: '0' },
        EA: { axis: 'EA', percentage: '0' },
        LC: { axis: 'LC', percentage: '0' },
      },
    };

    // Filtrar e mapear as performances
    schoolClass.dashboardPerformances.forEach((performance) => {
      if (performance.type === 'EXAM') {
        const color =
          this.performanceResultUtilsService.getStudentClassificationColor(
            this.mapSchoolGradeToNumeric(schoolClassEntity.schoolGrade),
            performance.axis,
            performance.level,
          );
        performancesMap.examPerformances.push({
          axis: performance.axis,
          percentage: Math.round(performance.result),
          color,
        });
      } else if (performance.type === 'PLANET') {
        // Atualizar a performance do planeta no mapa, evitando duplicidades
        if (performance.axis in performancesMap.planetPerformances) {
          // Verificar se a nova performance tem um percentual maior
          const currentPercentage =
            performancesMap.planetPerformances[performance.axis].percentage;
          const newPercentage = Math.round(performance.result);
          if (newPercentage > currentPercentage) {
            performancesMap.planetPerformances[performance.axis] = {
              axis: performance.axis,
              percentage: newPercentage,
            };
          }
        }
      }
    });

    // Converter o mapa de planetPerformances em uma matriz para a saída
    const planetPerformanceArray = Object.values(
      performancesMap.planetPerformances,
    );

    return {
      id: schoolClass.id,
      name: schoolClass.name,
      studentsCounter: schoolClass.studentsCounter,
      examPerformance: performancesMap.examPerformances,
      planetPerformance: planetPerformanceArray,
    };
  }

  private mapSchoolGradeToNumeric(schoolGradeYear: SchoolGradeEnum): number {
    switch (schoolGradeYear) {
      case SchoolGradeEnum.CHILDREN:
        return 0;
      case SchoolGradeEnum.FIRST_GRADE:
        return 1;
      case SchoolGradeEnum.SECOND_GRADE:
        return 2;
      case SchoolGradeEnum.THIRD_GRADE:
        return 3;
      default:
        return 0;
    }
  }

  async createSchoolYear(id: string, schoolYear: number): Promise<void> {
    try {
      const dashboard = await this.prisma.dashboard.create({
        data: {
          id: id,
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
    schoolYearId: string,
    schoolClassId: string,
    nameSchoolClass: string,
    grade: SchoolGradeEnum,
  ): Promise<void> {
    const studentsCounter = 0;

    try {
      const dashboardGrade = await this.prisma.dashboardSchoolGrade.findFirst({
        where: {
          dashboardId: schoolYearId,
          name: grade,
        },
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

      const performance: Prisma.DashboardPerformanceCreateManyInput[] = [];

      const axisCode = ['ES', 'EA', 'LC'];
      if (grade !== SchoolGradeEnum.CHILDREN) {
        axisCode.forEach((axis) => {
          performance.push({
            axis,
            type: 'EXAM',
            dashboardSchoolClassId: schoolClassId,
          });
        });

        axisCode.forEach((axis) => {
          performance.push({
            axis,
            type: 'PLANET',
            dashboardSchoolClassId: schoolClassId,
          });
        });
      } else {
        axisCode.forEach((axis) => {
          performance.push({
            axis,
            type: 'EXAM',
            dashboardSchoolClassId: schoolClassId,
          });
        });

        axisCode.forEach((axis) => {
          performance.push({
            axis,
            type: 'PLANET',
            dashboardSchoolClassId: schoolClassId,
          });
        });
      }

      await this.prisma.dashboardPerformance.createMany({
        data: performance,
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

  async updateDashboardPerformance(studentId: string, type: string) {
    const schoolClassStudent = await this.prisma.schoolClassStudent.findFirst({
      where: {
        studentId,
        active: true,
      },
      include: {
        schoolClass: {
          include: {
            schoolYear: true,
          },
        },
      },
    });

    if (!schoolClassStudent) {
      return;
    }

    const studentIds = await this.prisma.schoolClassStudent.findMany({
      where: {
        schoolClassId: schoolClassStudent.schoolClassId,
      },
      select: {
        studentId: true,
      },
    });

    const examResults = await this.prisma.studentExamResult.findMany({
      where: {
        studentId: {
          in: studentIds.map((entry) => entry.studentId),
        },
      },
      select: {
        axisCode: true,
        percent: true,
        level: true,
      },
    });

    const axisResults = {};

    examResults.forEach((result) => {
      if (!axisResults[result.axisCode]) {
        axisResults[result.axisCode] = {
          totalPercentage: 0,
          count: 0,
        };
      }
      axisResults[result.axisCode].totalPercentage += Number(result.percent);
      axisResults[result.axisCode].count++;
      axisResults[result.axisCode].level = result.level;
    });

    const updateOrCreatePerformanceExam = async (
      axisCode,
      schoolClassId,
      totalPercentage: number,
      type: string,
      level: string,
    ) => {
      const existingRecord = await this.prisma.dashboardPerformance.findFirst({
        where: {
          axis: axisCode,
          dashboardSchoolClassId: schoolClassId,
          type,
        },
      });

      const data = {
        axis: axisCode,
        type: 'EXAM',
        result: totalPercentage,
        dashboardSchoolClassId: schoolClassId,
        level: level,
      };

      if (existingRecord) {
        await this.prisma.dashboardPerformance.update({
          where: { id: existingRecord.id },
          data: {
            result: totalPercentage,
          },
        });
      } else {
        await this.prisma.dashboardPerformance.create({
          data,
        });
      }
    };

    const dashboard = await this.prisma.dashboard.findFirst({
      where: {
        schoolYear: {
          equals: schoolClassStudent.schoolClass.schoolYear.name,
        },
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

    const dashboardSchoolClass = dashboard.dashboardSchoolGrades
      .filter((item) => item.name == schoolClassStudent.schoolClass.schoolGrade)
      .reduce(
        (schoolClass, grade) => [...schoolClass, ...grade.dashboardSchoolClass],
        [],
      )
      .find((item) => item.name == schoolClassStudent.schoolClass.name);

    for (const axisCode in axisResults) {
      const axisInfo = axisResults[axisCode];
      const totalPercentage = axisInfo.totalPercentage / axisInfo.count;

      if (dashboardSchoolClass != undefined) {
        await updateOrCreatePerformanceExam(
          axisCode,
          dashboardSchoolClass.id,
          totalPercentage,
          type,
          axisInfo.level,
        );
      }
    }
  }

  async updateDashboardPerformancePlanet(studentId: string, type: string) {
    const schoolClassStudent = await this.prisma.schoolClassStudent.findFirst({
      where: {
        studentId,
        active: true,
      },
      include: {
        schoolClass: {
          include: {
            schoolYear: true,
          },
        },
      },
    });

    if (!schoolClassStudent) {
      return;
    }

    const studentIds = await this.prisma.schoolClassStudent.findMany({
      where: {
        schoolClassId: schoolClassStudent.schoolClassId,
      },
      select: {
        studentId: true,
      },
    });

    const planetResult = await this.prisma.studentPlanetResult.findMany({
      where: {
        studentId: {
          in: studentIds.map((entry) => entry.studentId),
        },
      },
      select: {
        axisCode: true,
        stars: true,
      },
    });

    const axisResults = {};

    planetResult.forEach((result) => {
      if (!axisResults[result.axisCode]) {
        axisResults[result.axisCode] = {
          averageStars: 0,
          count: 0,
        };
      }
      axisResults[result.axisCode].averageStars += Number(result.stars);
      axisResults[result.axisCode].count++;
    });

    const updateOrCreatePerformance = async (
      axisCode,
      schoolClassId,
      averageStars: number,
      type: string,
    ) => {
      const existingRecord = await this.prisma.dashboardPerformance.findFirst({
        where: {
          axis: axisCode,
          dashboardSchoolClassId: schoolClassId,
          type,
        },
      });

      const data = {
        axis: axisCode,
        type: 'PLANET',
        result: averageStars,
        dashboardSchoolClassId: schoolClassId,
      };

      if (existingRecord) {
        await this.prisma.dashboardPerformance.update({
          where: { id: existingRecord.id },
          data: {
            result: averageStars,
          },
        });
      } else {
        await this.prisma.dashboardPerformance.create({
          data,
        });
      }
    };

    const dashboard = await this.prisma.dashboard.findFirst({
      where: {
        schoolYear: {
          equals: schoolClassStudent.schoolClass.schoolYear.name,
        },
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

    const dashboardSchoolClass = dashboard.dashboardSchoolGrades
      .filter((item) => item.name == schoolClassStudent.schoolClass.schoolGrade)
      .reduce(
        (schoolClass, grade) => [...schoolClass, ...grade.dashboardSchoolClass],
        [],
      )
      .find((item) => item.name == schoolClassStudent.schoolClass.name);

    for (const axisCode in axisResults) {
      const axisInfo = axisResults[axisCode];
      const averageStars = axisInfo.averageStars / axisInfo.count;
      await updateOrCreatePerformance(
        axisCode,
        dashboardSchoolClass.id,
        averageStars,
        type,
      );
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
