import { Injectable } from '@nestjs/common';
import { EduException } from '../exceptions/edu-school.exception';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalApiService } from './external-api.service';
import { StatusSchoolYear } from '@prisma/client';
import { SchoolYearSummary } from './dto/list-school-year.dto';

@Injectable()
export class SchoolYearService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly externalApiService: ExternalApiService,
  ) {}

  async isSchoolYearCreatable(year: number): Promise<boolean> {
    const schoolYears = await this.prismaService.schoolYear.findMany({
      where: {
        OR: [
          { status: StatusSchoolYear.ACTIVE },
          { status: StatusSchoolYear.DRAFT },
        ],
        name: year,
      },
    });

    return schoolYears.length === 0;
  }

  async createSchoolYear(year: number, schoolId: string): Promise<void> {
    await this.prismaService.schoolYear.create({
      data: {
        name: year,
        schoolId: schoolId,
        status: StatusSchoolYear.DRAFT,
      },
    });
  }

  async createNextAvailableSchoolYear(schoolId: string): Promise<void> {
    const currentYear = await this.externalApiService.getCurrentDateTime();
    const currentschoolYear = await this.isSchoolYearCreatable(currentYear);

    if (!currentschoolYear) {
      const lastYear = currentYear + 1;
      const lastschoolYear = await this.isSchoolYearCreatable(lastYear);
      if (lastschoolYear) {
        await this.createSchoolYear(lastYear, schoolId);
      } else {
        throw new EduException('NEXT_SCHOOL_YEAR_ALREADY_EXISTS');
      }
    } else {
      await this.createSchoolYear(currentYear, schoolId);
    }
  }

  async findAllSchoolYears(): Promise<SchoolYearSummary[]> {
    const currentYear = await this.externalApiService.getCurrentDateTime();
    const schoolYears = await this.prismaService.schoolYear.findMany({
      include: {
        schoolClasses: true,
      },
    });

    return await Promise.all(
      schoolYears.map(async (schoolYear) => {
        const totalSchoolClasses = await this.prismaService.schoolClass.count({
          where: {
            schoolYearId: schoolYear.id,
          },
        });

        const totalTeachers = await this.prismaService.userSchoolClass.count({
          where: {
            schoolClass: {
              schoolYearId: schoolYear.id,
            },
          },
        });

        const totalStudents = await this.getNumberOfStudents(schoolYear.id);

        const buttonEnabled =
          schoolYear.status === 'DRAFT' && currentYear == schoolYear.name;

        return {
          id: schoolYear.id,
          name: schoolYear.name,
          status: schoolYear.status,
          createdAt: schoolYear.createdAt,
          updatedAt: schoolYear.updatedAt,
          summary: {
            totalSchoolClasses,
            totalStudents,
            totalTeachers,
            buttonEnabled,
          },
        };
      }),
    );
  }

  private async getNumberOfStudents(schoolYearId: string): Promise<number> {
    return this.prismaService.schoolClassStudent.count({
      where: {
        schoolClass: {
          schoolYearId,
        },
      },
    });
  }

  async activateSchoolYear(id: string): Promise<void> {
    const selectedSchoolYear = await this.prismaService.schoolYear.findUnique({
      where: { id },
    });

    if (!selectedSchoolYear) {
      throw new EduException('SCHOOL_YEAR_NOT_FOUND');
    }

    const currentYear = await this.externalApiService.getCurrentDateTime();

    if (selectedSchoolYear.name === currentYear) {
      if (selectedSchoolYear.status === StatusSchoolYear.DRAFT) {
        await this.prismaService.schoolYear.update({
          where: { id },
          data: {
            status: StatusSchoolYear.ACTIVE,
          },
        });

        const lastYear = currentYear - 1;

        const schoolLastYear = await this.prismaService.schoolYear.findFirst({
          where: { name: lastYear },
        });

        if (schoolLastYear != null) {
          const previousYears = await this.prismaService.schoolYear.findMany({
            where: {
              name: { lte: lastYear },
              schoolId: schoolLastYear.schoolId,
              status: StatusSchoolYear.ACTIVE,
            },
          });

          await this.prismaService.schoolYear.updateMany({
            where: {
              id: { in: previousYears.map((year) => year.id) },
            },
            data: {
              status: StatusSchoolYear.INACTIVE,
            },
          });
        }
      } else if (selectedSchoolYear.status === StatusSchoolYear.ACTIVE) {
        throw new EduException('SCHOOL_YEAR_IS_ALREADY_ACTIVE');
      } else if (selectedSchoolYear.status === StatusSchoolYear.INACTIVE) {
        throw new EduException('SCHOOL_YEAR_IS_INACTIVE');
      }
    } else {
      if (selectedSchoolYear)
        throw new EduException('SCHOOL_YEAR_CANNOT_BE_ACTIVATED');
    }
  }

  async deleteSchoolYearById(id: string): Promise<void> {
    await this.prismaService.schoolYear.delete({
      where: { id },
    });
  }

  async deleteSchoolClassesBySchoolYearId(schoolYearId: string): Promise<void> {
    await this.prismaService.schoolClass.deleteMany({
      where: { schoolYearId },
    });
  }

  async deleteSchoolYearAndClasses(id: string): Promise<void> {
    await this.deleteSchoolClassesBySchoolYearId(id);
    await this.deleteSchoolYearById(id);
  }
}
