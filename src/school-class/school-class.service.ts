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
import { DashboardService } from '../dashboard/dashboard.service';
import { AddStudentsToClassDto } from './dto/add-students-to-class.dto';
import { UpdateStudentReservedResponseDto } from './dto/response/update-student-reserved-response';
import { ReservedStudentRequestDto } from './dto/request/reserved-student-request.dto';
import { StudentSimplifiedResponseDto } from '../student/dto/response/student-simplified-response.dto';
import { StudentExamService } from '../student/studentExam.service';

@Injectable()
export class SchoolClassService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dashboard: DashboardService,
    private readonly studentExamService: StudentExamService,
  ) {}

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

    this.dashboard
      .createSchoolClass(
        schoolClass.schoolYearId,
        schoolClass.id,
        schoolClass.name,
        schoolClass.schoolGrade,
      )
      .then((r) => console.log(r));

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
    updateSchoolClassDto: UpdateSchoolClassRequestDto,
  ): Promise<CreateSchoolClassResponseDto> {
    const { teacherIds, ...schoolClassData } = updateSchoolClassDto;

    const existingSchoolClass = await this.validateSchoolClassExists(id);
    await this.updateClassData(id, schoolClassData);
    if (teacherIds != null) {
      await this.handleUserSchoolClassUpdates(id, teacherIds);
    }

    await this.updateDashboardData(id);

    return await this.createResponseDto(id);
  }

  private async validateSchoolClassExists(id: string) {
    const existingSchoolClass = await this.prismaService.schoolClass.findUnique(
      { where: { id } },
    );
    if (!existingSchoolClass) {
      throw new EduException('SCHOOL_CLASS_NOT_FOUND');
    }
    return existingSchoolClass;
  }

  private async updateClassData(id: string, schoolClassData: any) {
    return this.prismaService.schoolClass.update({
      where: { id },
      data: schoolClassData,
    });
  }

  private async getExistingUserIdsForClass(id: string): Promise<string[]> {
    const existingUserSchoolClasses =
      await this.prismaService.userSchoolClass.findMany({
        where: { schoolClassId: id },
        select: { userId: true },
      });

    return existingUserSchoolClasses.map(
      (userSchoolClass) => userSchoolClass.userId,
    );
  }

  private async handleUserSchoolClassUpdates(id: string, teacherIds: string[]) {
    const existingUserIds = await this.getExistingUserIdsForClass(id);

    const newUserSchoolClasses = teacherIds
      .filter((teacherId) => !existingUserIds.includes(teacherId))
      .map((teacherId) => ({
        userId: teacherId,
        schoolClassId: id,
      }));

    if (newUserSchoolClasses.length > 0) {
      await this.prismaService.userSchoolClass.createMany({
        data: newUserSchoolClasses,
      });
    }
  }

  private async updateDashboardData(id: string) {
    const schoolYear = await this.getSchoolYearNameFromClassId(id);
    await this.dashboard.updateDashboardData(schoolYear);
  }

  private async createResponseDto(
    id: string,
  ): Promise<CreateSchoolClassResponseDto> {
    const schoolClass = await this.prismaService.schoolClass.findUnique({
      where: { id },
    });
    const teacherIdsAssociated = await this.getExistingUserIdsForClass(id);

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

    this.dashboard.updateDashboardData().then();

    await this.prismaService.schoolClass.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return { success: true };
  }

  async getStudentsByClass(
    schoolClassId: string,
    pageNumber: number,
    pageSize: number,
  ): Promise<PaginationResponse<StudentSimplifiedResponseDto>> {
    const skip = (pageNumber - 1) * pageSize;

    try {
      const totalCount = await this.prismaService.schoolClassStudent.count({
        where: {
          schoolClassId: schoolClassId,
        },
      });

      const totalPages = Math.ceil(totalCount / pageSize);

      const pagination = {
        totalItems: totalCount,
        pageSize: pageSize,
        pageNumber: pageNumber,
        totalPages: totalPages,
        previousPage: pageNumber > 1 ? pageNumber - 1 : 0,
        nextPage: pageNumber < totalPages ? pageNumber + 1 : 0,
        lastPage: totalPages,
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < totalPages,
      };

      const schoolClassStudents =
        await this.prismaService.schoolClassStudent.findMany({
          where: {
            schoolClassId: schoolClassId,
          },
          skip,
          take: pageSize,
          include: {
            student: true,
          },
        });

      const responseStudents: StudentSimplifiedResponseDto[] =
        await Promise.all(
          schoolClassStudents.map(async (scs) => {
            const student = scs.student;
            const examPerformed =
              await this.studentExamService.getExamPerformedStatusByStudentId(
                student.id,
              );
            return {
              id: student.id,
              name: student.name,
              registry: student.registry,
              status: student.status,
              reserved: scs.reserved,
              examPerformed: examPerformed,
            };
          }),
        );

      return new PaginationResponse(responseStudents, pagination);
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
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

    const schollYear = await this.getSchoolYearNameFromClassId(schoolClassId);
    this.dashboard.updateDashboardData(schollYear).then();
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
          reserved: false,
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

    const schollYear = await this.getSchoolYearNameFromClassId(schoolClassId);
    this.dashboard.updateDashboardData(schollYear).then();
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

    const promises_moveToDestination = data.studentIds.map((studentId) =>
      this.prismaService.student.update({
        where: { id: studentId },
        data: {
          schoolClasses: {
            deleteMany: { studentId: studentId },
            create: {
              schoolClass: { connect: { id: destinationClass.id } },
            },
          },
        },
        include: {
          schoolClasses: { include: { schoolClass: true } },
        },
      }),
    );

    await Promise.all(promises_moveToDestination);
    const schollYear = await this.getSchoolYearNameFromClassId(
      destinationClass.id,
    );
    this.dashboard.updateDashboardData(schollYear).then();

    return {
      studentsMoved: promises_moveToDestination.length,
      destinationClass: destinationClass.name,
      originClass: originClass.name,
    };
  }

  async updateStudentReserved(
    schoolClassId: string,
    studentId: string,
    requestDto: ReservedStudentRequestDto,
  ): Promise<UpdateStudentReservedResponseDto> {
    try {
      const updatedSchoolClassStudent =
        await this.prismaService.schoolClassStudent.updateMany({
          where: {
            schoolClassId: schoolClassId,
            studentId: studentId,
          },
          data: {
            reserved: requestDto.reserved,
          },
        });

      if (updatedSchoolClassStudent.count > 0) {
        return { success: true };
      } else {
        throw new EduException('STUDENT_NOT_FOUND');
      }
    } catch (error) {
      if (error instanceof EduException) {
        throw error;
      } else {
        throw new EduException('DATABASE_ERROR');
      }
    }
  }

  async getSchoolYearNameFromClassId(classId: string): Promise<number> {
    const schoolClass = await this.prismaService.schoolClass.findUnique({
      where: { id: classId },
      include: { schoolYear: true },
    });

    if (!schoolClass) {
      throw new Error('SchoolClass not found.');
    }

    return schoolClass.schoolYear.name;
  }
}
