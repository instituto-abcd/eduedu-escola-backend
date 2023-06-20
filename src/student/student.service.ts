import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentRequestDto } from './dto/request/create-student-request.dto';
import { UpdateStudentRequestDto } from './dto/request/update-student-request.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import { Prisma, Status } from '@prisma/client';
import { StudentResponseDto } from './dto/response/student-response.dto';
import { PaginationResponse } from './dto/response/pagination-student-response.dto';
import { InativeStudantRequestDto } from './dto/request/inative-studant-request.dto';
import { InativeStudentResponseDto } from './dto/response/inative-student-response.dto';

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createStudentDto: CreateStudentRequestDto,
  ): Promise<StudentResponseDto> {
    const { name, registry, status, schoolClassId } = createStudentDto;

    if (!name || !registry || !schoolClassId) {
      throw new EduException('MISSING_REQUIRED_FIELDS');
    }

    const createdStudent = await this.prisma.student.create({
      data: {
        name,
        registry,
        status,
        schoolClasses: schoolClassId
          ? {
              create: {
                schoolClassId,
              },
            }
          : undefined,
      },
      include: {
        schoolClasses: {
          include: {
            schoolClass: true,
          },
        },
      },
    });

    const schoolClass = createdStudent.schoolClasses?.[0]?.schoolClass || null;

    return {
      id: createdStudent.id,
      name: createdStudent.name,
      registry: createdStudent.registry,
      schoolClassId: schoolClass?.id || null,
      schoolClassName: schoolClass?.name || null,
      schoolPeriod: schoolClass?.schoolPeriod || null,
      schoolGrade: schoolClass?.schoolGrade || null,
      status: createdStudent.status,
    };
  }

  async findAll(
    pageNumber: number,
    pageSize: number,
    filters: any,
  ): Promise<PaginationResponse<StudentResponseDto>> {
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber <= 0 ||
      !Number.isInteger(pageSize) ||
      pageSize <= 0
    ) {
      throw new EduException('INVALID_PAGINATION_PARAMETERS');
    }

    const {
      name,
      schoolClassName,
      schoolPeriod,
      schoolGrade,
      cfo,
      sea,
      lct,
      status,
    } = filters || {};

    const where: Prisma.StudentWhereInput = {
      name: name ? { contains: name, mode: 'insensitive' } : undefined,
      status: status ? { equals: status } : undefined,
      schoolClasses: {
        some: {
          schoolClass: {
            name: schoolClassName
              ? { contains: schoolClassName, mode: 'insensitive' }
              : undefined,
            schoolPeriod: schoolPeriod ? { equals: schoolPeriod } : undefined,
            schoolGrade: schoolGrade ? { equals: schoolGrade } : undefined,
          },
        },
      },
    };

    try {
      const students = await this.prisma.student.findMany({
        where,
        include: {
          schoolClasses: {
            include: {
              schoolClass: true,
            },
          },
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      });

      const totalCount = await this.prisma.student.count({
        where,
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

      const responseStudents: StudentResponseDto[] = students.map((student) => {
        const cfo = Math.floor(Math.random() * 100) + 1;
        const sea = Math.floor(Math.random() * 100) + 1;
        const lct = Math.floor(Math.random() * 100) + 1;

        return {
          id: student.id,
          name: student.name,
          registry: student.registry,
          schoolClassId: student.schoolClasses[0]?.schoolClass.id,
          schoolClassName: student.schoolClasses[0]?.schoolClass.name,
          schoolPeriod: student.schoolClasses[0]?.schoolClass.schoolPeriod,
          schoolGrade: student.schoolClasses[0]?.schoolClass.schoolGrade,
          cfo: cfo.toString().concat('%'),
          sea: sea.toString().concat('%'),
          lct: lct.toString().concat('%'),
          status: student.status,
        };
      });

      return new PaginationResponse(responseStudents, pagination);
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
  }

  async findOne(id: string): Promise<StudentResponseDto> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        schoolClasses: {
          include: {
            schoolClass: true,
          },
        },
      },
    });

    if (!student) {
      throw new EduException('STUDENT_NOT_FOUND');
    }

    const { id: studentId, name, registry, schoolClasses, status } = student;

    const schoolClass = schoolClasses[0]?.schoolClass;

    const schoolClassId = schoolClass?.id ?? null;
    const schoolClassName = schoolClass?.name ?? null;
    const schoolPeriod = schoolClass?.schoolPeriod ?? null;
    const schoolGrade = schoolClass?.schoolGrade ?? null;

    return {
      id: studentId,
      name,
      registry,
      schoolClassId,
      schoolClassName,
      schoolPeriod,
      schoolGrade,
      status,
    };
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentRequestDto,
  ): Promise<StudentResponseDto> {
    const { name, registry, status, schoolClassId } = updateStudentDto;

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        name,
        registry,
        status,
        schoolClasses: {
          updateMany: {
            where: { studentId: id },
            data: { schoolClassId },
          },
        },
      },
      include: {
        schoolClasses: {
          include: {
            schoolClass: true,
          },
        },
      },
    });

    const { id: studentId, schoolClasses } = updatedStudent;

    const schoolClass = schoolClasses[0]?.schoolClass;

    const schoolClassName = schoolClass?.name ?? null;
    const schoolPeriod = schoolClass?.schoolPeriod ?? null;
    const schoolGrade = schoolClass?.schoolGrade ?? null;

    return {
      id: studentId,
      name: updatedStudent.name,
      registry: updatedStudent.registry,
      schoolClassId,
      schoolClassName,
      schoolPeriod,
      schoolGrade,
      status: updatedStudent.status,
    };
  }

  async delete(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new EduException('IDS_REQUIRED');
    }

    await this.prisma.schoolClassStudent.deleteMany({
      where: {
        studentId: {
          in: ids,
        },
      },
    });

    const deleteResult = await this.prisma.student.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (deleteResult.count === 0) {
      throw new EduException('STUDENT_NOT_FOUND');
    }

    return { success: true };
  }

  async deactivateStudants(
    requestDto: InativeStudantRequestDto,
  ): Promise<InativeStudentResponseDto> {
    try {
      const { ids } = requestDto;

      if (!ids || ids.length === 0) {
        throw new EduException('IDS_REQUIRED');
      }

      const students = await this.prisma.student.findMany({
        where: { id: { in: ids } },
      });

      const existingStudantsIds = students.map((student) => student.id);

      await this.prisma.student.updateMany({
        where: { id: { in: existingStudantsIds }, status: Status.ACTIVE },
        data: { status: Status.INACTIVE },
      });

      const success = existingStudantsIds.length > 0;

      return { success };
    } catch (error) {
      if (error instanceof EduException) {
        throw error;
      }
      throw new EduException('DATABASE_ERROR');
    }
  }
}
