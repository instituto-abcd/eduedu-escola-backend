import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import { CreateSchoolClassResponseDto } from './dto/response/create-school-class-response';
import { SchoolClassResponseDto } from './dto/response/school-class-response';
import { DeleteUserResponseDto } from '../user/dto/response/delete-user-response.dto';
import { PaginationInfo } from '../common/pagination/pagination-info-response.dto';
import { PaginationResponse } from '../common/pagination/pagination-response.dto';
import { Prisma, SchoolClassStudent, Status, Student } from '@prisma/client';
import * as xlsx from 'xlsx';
import { CreateStudentRequestDto } from '../student/dto/request/create-student-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { UpdateSchoolClassRequestDto } from './dto/request/update-school-class-request';
import { AddStudentsToClassDto } from './dto/add-students-to-class.dto';

@Injectable()
export class SchoolClassService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createSchoolClassDto: CreateSchoolClassDto,
    schoolId: string,
  ): Promise<CreateSchoolClassResponseDto> {
    const { teacherIds, ...schoolClassData } =
      createSchoolClassDto as CreateSchoolClassDto;

    this.validateCreateSchoolClassDto(createSchoolClassDto, teacherIds);

    const schoolClass = await this.prismaService.schoolClass.create({
      data: {
        ...schoolClassData,
        schoolId,
      },
    });

    await this.associateTeachersWithSchoolClass(schoolClass.id, teacherIds);

    const teachers = await this.prismaService.userSchoolClass.findMany({
      where: { schoolClassId: schoolClass.id },
      select: { userId: true },
    });

    const teacherIdsAssociated = teachers.map((teacher) => teacher.userId);

    return {
      id: schoolClass.id,
      name: schoolClass.name,
      schoolGrade: schoolClass.schoolGrade,
      schoolPeriod: schoolClass.schoolPeriod,
      createdAt: schoolClass.createdAt,
      updatedAt: schoolClass.updatedAt,
      teachers: teacherIdsAssociated,
    };
  }

  async findAll(
    pageNumber: number,
    pageSize: number,
    filters: any,
  ): Promise<PaginationResponse<SchoolClassResponseDto>> {
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber <= 0 ||
      !Number.isInteger(pageSize) ||
      pageSize <= 0
    ) {
      throw new EduException('INVALID_PAGINATION_PARAMETERS');
    }

    const skip = (pageNumber - 1) * pageSize;

    const { name, schoolGrade, schoolPeriod, schoolYearName, teacherName } =
      filters || {};

    try {
      const where: Prisma.SchoolClassWhereInput = {};

      if (name !== undefined) {
        where.name = { equals: name };
      }

      if (schoolGrade !== undefined) {
        where.schoolGrade = { equals: schoolGrade };
      }

      if (schoolPeriod !== undefined) {
        where.schoolPeriod = { equals: schoolPeriod };
      }

      if (schoolYearName !== undefined) {
        const schoolYear = await this.prismaService.schoolYear.findFirst({
          where: { name: Number(schoolYearName) },
          select: { id: true },
        });

        if (schoolYear !== null) {
          where.schoolYearId = schoolYear.id;
        }
      }

      if (teacherName !== undefined) {
        const teachers = await this.prismaService.user.findMany({
          where: { name: teacherName },
          select: { id: true },
        });

        if (teachers.length > 0) {
          const teacherIds = teachers.map((teacher) => teacher.id);
          where.users = { some: { userId: { in: teacherIds } } };
        }
      }

      const totalCount = await this.prismaService.schoolClass.count({
        where,
      });

      const schoolClasses = await this.prismaService.schoolClass.findMany({
        where,
        skip,
        take: pageSize,
        include: { schoolYear: true, users: { include: { user: true } } },
      });

      const totalPages = Math.ceil(totalCount / pageSize);

      const pagination: PaginationInfo = {
        totalItems: totalCount,
        pageSize,
        pageNumber,
        totalPages,
        previousPage: pageNumber > 1 ? pageNumber - 1 : 0,
        nextPage: pageNumber < totalPages ? pageNumber + 1 : 0,
        lastPage: totalPages,
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < totalPages,
      };

      const responseSchoolClasses: SchoolClassResponseDto[] = schoolClasses.map(
        (schoolClass) => ({
          id: schoolClass.id,
          name: schoolClass.name,
          schoolGrade: schoolClass.schoolGrade,
          schoolPeriod: schoolClass.schoolPeriod,
          schoolYear: {
            id: schoolClass.schoolYear.id,
            name: schoolClass.schoolYear.name,
          },
          teachers: schoolClass.users.map((user) => ({
            id: user.user.id,
            name: user.user.name,
          })),
        }),
      );

      return {
        items: responseSchoolClasses,
        pagination,
      };
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
  }

  async findOne(schoolClassId: string): Promise<SchoolClassResponseDto> {
    const userSchoolClasses = await this.prismaService.userSchoolClass.findMany(
      {
        where: { schoolClassId },
        include: {
          schoolClass: {
            include: {
              schoolYear: true,
            },
          },
          user: true,
        },
      },
    );

    if (userSchoolClasses.length === 0) {
      throw new EduException('SCHOOL_CLASS_NOT_FOUND');
    }

    const { schoolClass } = userSchoolClasses[0];

    return {
      id: schoolClass.id,
      name: schoolClass.name,
      schoolGrade: schoolClass.schoolGrade,
      schoolPeriod: schoolClass.schoolPeriod,
      schoolYear: {
        id: schoolClass.schoolYear.id,
        name: schoolClass.schoolYear.name,
      },
      teachers: userSchoolClasses.map((userSchoolClass) => ({
        id: userSchoolClass.user.id,
        name: userSchoolClass.user.name,
      })),
    };
  }

  async updateSchoolClass(
    id: string,
    data: UpdateSchoolClassRequestDto,
  ): Promise<SchoolClassResponseDto> {
    const { name, schoolGrade, schoolPeriod, teachers } = data;

    await this.prismaService.schoolClass.update({
      where: { id },
      data: { name, schoolGrade, schoolPeriod },
    });

    const existingUserSchoolClasses =
      await this.prismaService.userSchoolClass.findMany({
        where: { schoolClassId: id },
        select: { userId: true },
      });

    const existingUserIds = existingUserSchoolClasses.map(
      (userSchoolClass) => userSchoolClass.userId,
    );

    const newUserSchoolClasses = teachers
      .filter((teacher) => !existingUserIds.includes(teacher.id))
      .map((teacher) => ({
        userId: teacher.id,
        schoolClassId: id,
      }));

    if (newUserSchoolClasses.length > 0) {
      await this.prismaService.userSchoolClass.createMany({
        data: newUserSchoolClasses,
      });
    }

    return this.findOne(id);
  }

  async remove(ids: string[]): Promise<DeleteUserResponseDto> {
    if (!ids || ids.length === 0) {
      throw new EduException('IDS_REQUIRED');
    }

    await this.prismaService.userSchoolClass.deleteMany({
      where: {
        schoolClassId: {
          in: ids,
        },
      },
    });

    await this.prismaService.schoolClass.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return { success: true };
  }

  studentsByClass(schoolClassId: string) {
    return this.prismaService.student.findMany({
      where: { schoolClasses: { some: { schoolClassId } } },
    });
  }

  private validateCreateSchoolClassDto(
    schoolClassData: CreateSchoolClassDto,
    teacherIds: string[],
  ): void {
    const { name, schoolYearId, schoolGrade, schoolPeriod } = schoolClassData;

    if (!name) {
      throw new EduException('MISSING_NAME');
    }

    if (!schoolYearId) {
      throw new EduException('MISSING_SCHOOL_YEAR');
    }

    if (!schoolGrade) {
      throw new EduException('MISSING_SCHOOL_GRADE');
    }

    if (!schoolPeriod) {
      throw new EduException('MISSING_SCHOOL_PERIOD');
    }

    if (!teacherIds || teacherIds.length === 0) {
      throw new EduException('IDS_TEACHER_REQUIRED');
    }
  }

  private async associateTeachersWithSchoolClass(
    schoolClassId: string,
    teacherIds: string[],
  ): Promise<void> {
    if (!teacherIds || teacherIds.length === 0) {
      throw new EduException('IDS_TEACHER_REQUIRED');
    }

    const existingUserIds = await this.prismaService.user.findMany({
      where: {
        id: { in: teacherIds },
      },
      select: { id: true },
    });

    const existingUserIdsSet = new Set(existingUserIds.map((user) => user.id));

    for (const teacherId of teacherIds) {
      if (!existingUserIdsSet.has(teacherId)) {
        throw new EduException('TEACHER_NOT_FOUND');
      }
    }

    const userSchoolClassData = teacherIds.map((teacherId) => ({
      userId: teacherId,
      schoolClassId,
    }));

    await this.prismaService.userSchoolClass.createMany({
      data: userSchoolClassData,
      skipDuplicates: true,
    });
  }

  async parseSpreadsheet(
    file: Express.Multer.File,
  ): Promise<CreateStudentRequestDto[]> {
    return new Promise((resolve) => {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const studentsData: string[][] = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      }) as string[][];

      const headerRow = studentsData[0];
      const nameColumnIndex = headerRow.findIndex((column) =>
        /nome|nome completo|nome do aluno/i.test(column),
      );
      const registryColumnIndex = headerRow.findIndex((column) =>
        /matrícula|ra|cpf/i.test(column),
      );

      const students: CreateStudentRequestDto[] = studentsData
        .slice(1)
        .filter((row) => row.length > 0)
        .map((row) => {
          const name = row[nameColumnIndex]?.toString().trim();
          const registry = row[registryColumnIndex]?.toString().trim();

          if (!name || !registry) {
            throw new EduException('INVALID_FIELDS_WORKSHEET');
          }

          return {
            id: uuidv4(),
            name,
            registry,
            status: Status.ACTIVE,
          };
        });

      resolve(students);
    });
  }

  validateSpreadsheetData(studentsData: CreateStudentRequestDto[]): string[] {
    const errors: string[] = [];

    studentsData.forEach((student, index) => {
      if (!student.name || !student.registry) {
        errors.push(`Registro inválido na linha ${index + 1}`);
      }
    });

    return errors;
  }

  async addStudentsToClass(
    schoolClassId: string,
    studentsData: CreateStudentRequestDto[],
  ): Promise<Student[]> {
    const schoolClass = await this.prismaService.schoolClass.findUnique({
      where: { id: schoolClassId },
      include: { students: true },
    });

    if (!schoolClass) {
      throw new EduException('SCHOOL_CLASS_NOT_FOUND');
    }

    const createdStudents: Student[] = [];

    for (const studentData of studentsData) {
      const existingStudent = await this.prismaService.student.findFirst({
        where: {
          id: studentData.id,
        },
      });

      if (existingStudent) {
        continue;
      }

      let createdStudent: Student;
      try {
        createdStudent = await this.prismaService.student.create({
          data: {
            name: studentData.name,
            registry: studentData.registry.toString(),
            status: studentData.status || Status.ACTIVE,
            schoolClasses: {
              create: [{ schoolClass: { connect: { id: schoolClassId } } }],
            },
          },
        });
      } catch (error) {
        throw new EduException('STUDENT_CREATION_FAILED');
      }

      const existingSchoolClassStudent =
        await this.prismaService.schoolClassStudent.findFirst({
          where: {
            schoolClassId: schoolClassId,
            studentId: createdStudent.id,
          },
        });

      if (!existingSchoolClassStudent) {
        const schoolClassStudent: SchoolClassStudent = {
          schoolClassId: schoolClassId,
          studentId: createdStudent.id,
          active: true,
        };

        try {
          await this.prismaService.schoolClassStudent.create({
            data: schoolClassStudent,
          });
        } catch (error) {
          // Rollback student creation if adding to schoolClassStudent fails
          await this.prismaService.student.delete({
            where: { id: createdStudent.id },
          });
          throw new EduException('SCHOOL_CLASS_STUDENT_CREATION_FAILED');
        }
      }

      createdStudents.push(createdStudent);
    }

    return createdStudents;
  }

  async moveStudentsToClass(
    destinationId: string,
    data: AddStudentsToClassDto,
  ) {
    const destinationClass = await this.prismaService.schoolClass.findUnique({
      where: { id: destinationId },
    });

    if (!destinationClass) {
      throw new EduException('SCHOOL_CLASS_NOT_FOUND');
    }

    const originClass = await this.prismaService.schoolClass.findUnique({
      where: { id: data.originId },
    });

    if (!originClass) {
      throw new EduException('SCHOOL_CLASS_NOT_FOUND');
    }

    if (originClass.id === destinationClass.id) {
      throw new HttpException(
        'Classe destino precisa ser diferente da atual',
        400,
      );
    }

    await this.prismaService.schoolClassStudent.update({
      where: {
        schoolClassId: originClass.id,
      },
      data: {
        active: false,
      },
    });

    const promises_moveToDestination = data.studentIds.map((studentId) =>
      this.prismaService.schoolClassStudent.upsert({
        where: {
          schoolClassId: destinationClass.id,
        },
        create: {
          schoolClassId: destinationClass.id,
          studentId,
          active: true,
        },
        update: {
          schoolClassId: destinationClass.id,
          active: true,
        },
      }),
    );

    await Promise.all(promises_moveToDestination);

    return {
      studentsMoved: promises_moveToDestination.length,
      destinationClass: destinationClass.name,
      originClass: originClass.name,
    };
  }
}
