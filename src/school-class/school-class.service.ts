import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import { CreateSchoolClassResponseDto } from './dto/response/create-school-class-response';
import { SchoolClassResponseDto } from './dto/response/school-class-response';
import { DeleteUserResponseDto } from '../user/dto/response/delete-user-response.dto';
import { PaginationResponse } from '../common/pagination/pagination-response.dto';
import {
  Prisma,
  Profile,
  SchoolClassStudent,
  Status,
  Student,
} from '@prisma/client';
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
    try {
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
    } catch (e) {
      if (e.code === 'P2002') {
        throw new EduException('SCHOOL_CLASS_EXISTS');
      }
      throw new EduException('UNKNOWN_ERROR');
    }
  }

  async findAll(
    pageNumber = 1,
    pageSize = 10,
    filters: any = {},
    user: any,
  ): Promise<PaginationResponse<SchoolClassResponseDto>> {
    const validatePaginationParameters = () => {
      if (
        !Number.isInteger(pageNumber) ||
        pageNumber <= 0 ||
        !Number.isInteger(pageSize) ||
        pageSize <= 0
      ) {
        throw new EduException('INVALID_PAGINATION_PARAMETERS');
      }
    };

    const buildWhereClause = async () => {
      const { name, schoolGrade, schoolPeriod, schoolYearName, teacherName } =
        filters;
      const where: Prisma.SchoolClassWhereInput = {};

      if (name) where.name = { contains: name };
      if (schoolGrade) where.schoolGrade = { equals: schoolGrade };
      if (schoolPeriod) where.schoolPeriod = { equals: schoolPeriod };
      if (schoolYearName) {
        const schoolYear = await this.prismaService.schoolYear.findFirst({
          where: { name: Number(schoolYearName) },
          select: { id: true },
        });
        if (schoolYear) where.schoolYearId = schoolYear.id;
      }
      if (teacherName) {
        const teachers = await this.prismaService.user.findMany({
          where: { name: { contains: teacherName } },
          select: { id: true },
        });
        if (teachers.length > 0) {
          const teacherIds = teachers.map((teacher) => teacher.id);
          where.users = { some: { userId: { in: teacherIds } } };
        }
      }
      return where;
    };

    const retrieveClasses = async (where: Prisma.SchoolClassWhereInput) => {
      const totalCount = await this.prismaService.schoolClass.count({ where });
      const schoolClasses = await this.prismaService.schoolClass.findMany({
        where,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: {
          schoolYear: true,
          students: true,
          users: { include: { user: true } },
        },
      });
      return { totalCount, schoolClasses };
    };

    try {
      validatePaginationParameters();
      const where =
        user.profile === Profile.DIRECTOR
          ? await buildWhereClause()
          : { id: { in: await this.userClasses(user.id) } };
      const { totalCount, schoolClasses } = await retrieveClasses(where);
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items: schoolClasses.map((schoolClass) => ({
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
          studentsCount: schoolClass.students.length,
        })),
        pagination: {
          totalItems: totalCount,
          pageSize,
          pageNumber,
          totalPages,
          previousPage: pageNumber > 1 ? pageNumber - 1 : 0,
          nextPage: pageNumber < totalPages ? pageNumber + 1 : 0,
          lastPage: totalPages,
          hasPreviousPage: pageNumber > 1,
          hasNextPage: pageNumber < totalPages,
        },
      };
    } catch (error) {
      throw new NotFoundException('Turmas não encontradas');
    }
  }

  async userClasses(userId: string): Promise<string[]> {
    const uniqueClassIds = await this.prismaService.userSchoolClass.findMany({
      where: { userId },
      select: { schoolClassId: true },
      distinct: ['schoolClassId'],
    });
    return uniqueClassIds.map(({ schoolClassId }) => schoolClassId);
  }

  async findOne(schoolClassId: string): Promise<SchoolClassResponseDto> {
    const userSchoolClasses = await this.prismaService.userSchoolClass.findMany(
      {
        where: { schoolClassId },
        include: {
          schoolClass: {
            include: {
              schoolYear: true,
              students: true,
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
      studentsCount: schoolClass.students.length,
    };
  }

  async updateSchoolClass(
    id: string,
    updateSchoolClassDto: UpdateSchoolClassRequestDto,
  ): Promise<CreateSchoolClassResponseDto> {
    const { teacherIds, ...schoolClassData } = updateSchoolClassDto;

    await this.validateSchoolClassExists(id);
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

    const teachersToAdd = teacherIds
      .filter((teacherId) => !existingUserIds.includes(teacherId))
      .map((teacherId) => ({ userId: teacherId, schoolClassId: id }));

    const teachersToRemove = existingUserIds.filter(
      (teacherId) => !teacherIds.includes(teacherId),
    );

    if (teachersToAdd.length > 0) {
      await this.prismaService.userSchoolClass.createMany({
        data: teachersToAdd,
      });
    }

    if (teachersToRemove.length > 0) {
      for (const teacherId of teachersToRemove) {
        await this.prismaService.userSchoolClass.deleteMany({
          where: { userId: teacherId, schoolClassId: id },
        });
      }
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

  async remove(ids: string[], user: any): Promise<DeleteUserResponseDto> {
    if (user.profile !== Profile.DIRECTOR) {
      throw new EduException('INVALID_PROFILE');
    }

    if (!ids || ids.length === 0) {
      throw new EduException('IDS_REQUIRED');
    }

    await this.prismaService.schoolClassStudent.deleteMany({
      where: {
        schoolClassId: {
          in: ids,
        },
      },
    });

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
    name?: string,
  ): Promise<PaginationResponse<StudentSimplifiedResponseDto>> {
    const skip = (pageNumber - 1) * pageSize;

    try {
      // Contagem total de estudantes para paginação
      const totalCount = await this.prismaService.schoolClassStudent.count({
        where: {
          schoolClassId,
          student: {
            name: name ? { contains: name, mode: 'insensitive' } : undefined,
          },
        },
      });

      const totalPages = Math.ceil(totalCount / pageSize);

      const pagination = {
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

      // Busca estudantes com paginação e ordenação
      const schoolClassStudents =
        await this.prismaService.schoolClassStudent.findMany({
          where: {
            schoolClassId,
            student: {
              name: name ? { contains: name, mode: 'insensitive' } : undefined,
            },
          },
          skip,
          take: pageSize,
          orderBy: {
            student: {
              name: 'asc',
            },
          },
          include: {
            student: true,
            schoolClass: true,
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
              examPerformed,
              firstAccess: scs.firstAccess,
              schoolGrade: scs.schoolClass.schoolGrade,
              schoolPeriod: scs.schoolClass.schoolPeriod,
              schoolClassId: scs.schoolClass.id,
              schoolClassName: scs.schoolClass.name,
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
          registry: studentData.registry,
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
          firstAccess: true,
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

  async findOneSchoolClassesByUser(userId: any): Promise<{ names: string }> {
    const ids = await this.userClasses(userId);

    const schoolClasses = await this.prismaService.userSchoolClass.findMany({
      where: {
        schoolClassId: {
          in: ids,
        },
      },
      include: {
        schoolClass: {
          select: {
            name: true,
            schoolYear: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const uniqueNames = new Set<string>();

    schoolClasses.forEach((userSchoolClass) => {
      const className = userSchoolClass.schoolClass.name;
      const yearName = userSchoolClass.schoolClass.schoolYear.name;
      const formattedName = `${className} - ${yearName}`;
      uniqueNames.add(formattedName);
    });

    const sortedUniqueNames = Array.from(uniqueNames).sort();

    const concatenatedNames = sortedUniqueNames.join(', ');

    return { names: concatenatedNames };
  }
}
