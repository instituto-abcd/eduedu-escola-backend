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

  async canCreateSchoolYear(name: number): Promise<boolean> {
    const schoolYears = await this.prismaService.schoolYear.findMany({
      where: {
        OR: [
          { status: StatusSchoolYear.ACTIVE },
          { status: StatusSchoolYear.DRAFT },
        ],
        name: name,
      },
    });

    return schoolYears.length === 0;
  }

  async createSchoolYear(schoolId: string): Promise<void> {
    const name = await this.externalApiService.getCurrentDateTime();
    const canCreateSchoolYear = await this.canCreateSchoolYear(name);

    if (!canCreateSchoolYear) {
      throw new EduException('CANNOT_CREATE_SCHOOL_YEAR');
    }

    await this.prismaService.schoolYear.create({
      data: {
        name,
        schoolId: schoolId,
        status: StatusSchoolYear.DRAFT,
      },
    });
  }

  async getAllSchoolYears(): Promise<SchoolYearSummary[]> {
    try {
      const schoolYears = await this.prismaService.schoolYear.findMany({
        include: {
          schoolClasses: {
            include: {
              students: true,
            },
          },
          school: true,
        },
      });

      return schoolYears.map((schoolYear) =>
        this.createSchoolYearSummary(schoolYear),
      );
    } catch (error) {
      throw new EduException('SCHOOL_YEAR_ALREADY_ACTIVE');
    }
  }

  private createSchoolYearSummary(schoolYear: any): SchoolYearSummary {
    const { schoolClasses } = schoolYear;

    const totalSchoolClasses = schoolClasses.length;

    const totalStudents = schoolClasses.reduce(
      (sum, schoolClass) => sum + schoolClass.students.length,
      0,
    );

    const totalTeachers = schoolClasses.reduce(
      (sum, schoolClass) => sum + schoolClass.teachers.length,
      0,
    );

    const buttonEnabled = totalStudents > 0 && totalTeachers > 0;

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
  }

  async activateSchoolYear(id: string): Promise<void> {
    const schoolYear = await this.prismaService.schoolYear.findUnique({
      where: { id },
    });

    if (!schoolYear) {
      throw new EduException('SCHOOL_YEAR_NOT_FOUND');
    }

    if (schoolYear.status === StatusSchoolYear.ACTIVE) {
      throw new EduException('SCHOOL_YEAR_ALREADY_ACTIVE');
    }

    await this.prismaService.schoolYear.update({
      where: { id: schoolYear.id },
      data: { status: StatusSchoolYear.ACTIVE },
    });

    const activeSchoolYear = await this.prismaService.schoolYear.findFirst({
      where: { status: StatusSchoolYear.ACTIVE },
    });

    if (activeSchoolYear && activeSchoolYear.id !== schoolYear.id) {
      await this.prismaService.schoolYear.update({
        where: { id: activeSchoolYear.id },
        data: { status: StatusSchoolYear.INACTIVE },
      });
    }
  }

  async deleteSchoolYear(id: string): Promise<void> {
    const schoolYear = await this.prismaService.schoolYear.findUnique({
      where: { id },
    });

    if (!schoolYear) {
      throw new EduException('SCHOOL_YEAR_NOT_FOUND');
    }

    await this.prismaService.schoolYear.delete({
      where: { id },
    });

    await this.prismaService.schoolClass.deleteMany({
      where: { schoolYearId: id },
    });
  }
}
