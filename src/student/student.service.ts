import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentRequestDto } from './dto/request/create-student-request.dto';
import { UpdateStudentRequestDto } from './dto/request/update-student-request.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import {
  Prisma,
  Profile,
  SchoolGradeEnum,
  Status,
  Student,
  StudentPlanetResult,
  UserSchoolClass,
} from '@prisma/client';
import { StudentResponseDto } from './dto/response/student-response.dto';
import { InativeStudantRequestDto } from './dto/request/inative-studant-request.dto';
import { InativeStudentResponseDto } from './dto/response/inative-student-response.dto';
import { PaginationResponse } from '../common/pagination/pagination-response.dto';
import { DashboardService } from '../dashboard/dashboard.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exam, ExamDocument } from '../exam/schemas/exam.schema';
import { QuestionDto } from '../exam/dto/question.dto';
import {
  AnswerRequestDto,
  OptionAnswer,
} from '../exam/dto/request/answers-request.dto';
import { AnswersResponseDto } from '../exam/dto/response/answers-response.dto';
import {
  AnswersPlanet,
  OptionsAnswers,
  Planet,
  StudentExam,
  StudentExamDocument,
} from './schemas/studentExam.schema';
import { ExamEvaluationResponseDto } from './dto/response/exam-evaluation-response.dto';
import { PlanetDocument } from 'src/planet-sync/schemas/planet.schema';
import { ExamResumes } from 'src/templates/exam-resume-templates';
import { AuthorizeNewExamResponseDto } from './dto/request/authorize-new-exam-response.dto';
import { AuthorizeNewExamRequestDto } from './dto/request/authorize-new-exam-request.dto';
import { QuestionPlanentDto } from '../exam/dto/question-planet.dto';
import { AnswersPlanetResponseDto } from '../exam/dto/response/answers-planet-response.dto';
import { StudentAwardService } from './studentAward.service';
import { StudentPlanetExecutionService } from './studentPlanetExecution.service';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: DashboardService,
    private readonly studentAward: StudentAwardService,
    private readonly studentPlanetExecution: StudentPlanetExecutionService,
    @InjectModel(Exam.name)
    private examModel: Model<ExamDocument>,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
    @InjectModel(Planet.name)
    private planetModel: Model<PlanetDocument>,
  ) {}

  async create(
    createStudentDto: CreateStudentRequestDto,
  ): Promise<StudentResponseDto> {
    const { name, registry, status, schoolClassId } = createStudentDto;

    if (!name || !registry || !schoolClassId) {
      throw new EduException('MISSING_REQUIRED_FIELDS');
    }

    const existingStudent = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: createStudentDto.id },
          { name: createStudentDto.name },
          { registry: createStudentDto.registry },
        ],
      },
    });

    if (existingStudent) {
      throw new EduException('STUDENT_ALREADY_EXISTS');
    }

    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: schoolClassId },
      include: { schoolYear: true },
    });

    if (!schoolClass) {
      throw new EduException('SCHOOL_CLASS_NOT_FOUND');
    }

    const createdStudent = await this.prisma.student.create({
      data: {
        id: createStudentDto.id,
        name,
        registry,
        status,
      },
    });

    await this.createExamStudant(createdStudent.id);

    await this.prisma.schoolClassStudent.create({
      data: {
        schoolClassId: schoolClass.id,
        studentId: createdStudent.id,
        active: true,
        reserved: false,
      },
    });

    const schollYear = await this.getSchoolYearNameFromClassId(schoolClass.id);
    this.dashboard.updateDashboardData(schollYear).then();

    return {
      id: createdStudent.id,
      name: createdStudent.name,
      registry: createdStudent.registry,
      schoolClassId: schoolClass.id,
      schoolClassName: schoolClass.name,
      schoolPeriod: schoolClass.schoolPeriod,
      schoolGrade: schoolClass.schoolGrade,
      status: createdStudent.status,
    };
  }

  async findAll(
    pageNumber: number,
    pageSize: number,
    filters: any,
    user: any,
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

    if (user.profile == Profile.DIRECTOR) {
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
            examResults: {
              where: {
                axisCode: {
                  in: ['LC', 'EA', 'ES'],
                },
              },
              orderBy: {
                examDate: 'desc',
              },
              take: 3,
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

        const responseStudents: StudentResponseDto[] = students.map(
          (student) => {
            const cfoResult = student.examResults.find(
              (result) =>
                result.studentId == student.id && result.axisCode == 'ES',
            );
            const seaResult = student.examResults.find(
              (result) =>
                result.studentId == student.id && result.axisCode == 'EA',
            );
            const lctResult = student.examResults.find(
              (result) =>
                result.studentId == student.id && result.axisCode == 'LC',
            );

            const cfo = cfoResult ? cfoResult.percent : 0;
            const sea = seaResult ? seaResult.percent : 0;
            const lct = lctResult ? lctResult.percent : 0;

            return {
              id: student.id,
              name: student.name,
              registry: student.registry,
              schoolClassId: student.schoolClasses[0]?.schoolClass.id,
              schoolClassName: student.schoolClasses[0]?.schoolClass.name,
              schoolPeriod: student.schoolClasses[0]?.schoolClass.schoolPeriod,
              schoolGrade: student.schoolClasses[0]?.schoolClass.schoolGrade,
              cfo: cfo
                ? Math.round(cfo.toNumber()).toString().concat('%')
                : '0%',
              sea: sea
                ? Math.round(sea.toNumber()).toString().concat('%')
                : '0%',
              lct: lct
                ? Math.round(lct.toNumber()).toString().concat('%')
                : '0%',
              status: student.status,
            };
          },
        );

        const filteredStudents = responseStudents.filter((student) => {
          if (cfo !== undefined && cfo !== '') {
            const cfoValue = parseFloat(student.cfo.replace('%', ''));
            if (cfoValue < cfo) {
              return false;
            }
          }

          if (sea !== undefined && sea !== '') {
            const seaValue = parseFloat(student.sea.replace('%', ''));
            if (seaValue < sea) {
              return false;
            }
          }

          if (lct !== undefined && lct !== '') {
            const lctValue = parseFloat(student.lct.replace('%', ''));
            if (lctValue < lct) {
              return false;
            }
          }
          return true;
        });

        return new PaginationResponse(filteredStudents, pagination);
      } catch (error) {
        throw new EduException('DATABASE_ERROR');
      }
    } else {
      try {
        const classIds = await this.userClasses(user.id);

        const where: Prisma.StudentWhereInput = {
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
          status: status ? { equals: status } : undefined,
          schoolClasses: {
            some: {
              schoolClassId: {
                in: classIds,
              },
              schoolClass: {
                name: schoolClassName
                  ? { contains: schoolClassName, mode: 'insensitive' }
                  : undefined,
                schoolPeriod: schoolPeriod
                  ? { equals: schoolPeriod }
                  : undefined,
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
              examResults: {
                where: {
                  axisCode: {
                    in: ['LC', 'EA', 'ES'],
                  },
                },
                orderBy: {
                  examDate: 'desc',
                },
                take: 3,
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

          const responseStudents: StudentResponseDto[] = students.map(
            (student) => {
              const cfoResult = student.examResults.find(
                (result) =>
                  result.studentId == student.id && result.axisCode == 'ES',
              );
              const seaResult = student.examResults.find(
                (result) =>
                  result.studentId == student.id && result.axisCode == 'EA',
              );
              const lctResult = student.examResults.find(
                (result) =>
                  result.studentId == student.id && result.axisCode == 'LC',
              );

              const cfo = cfoResult ? cfoResult.percent : 0;
              const sea = seaResult ? seaResult.percent : 0;
              const lct = lctResult ? lctResult.percent : 0;

              return {
                id: student.id,
                name: student.name,
                registry: student.registry,
                schoolClassId: student.schoolClasses[0]?.schoolClass.id,
                schoolClassName: student.schoolClasses[0]?.schoolClass.name,
                schoolPeriod:
                  student.schoolClasses[0]?.schoolClass.schoolPeriod,
                schoolGrade: student.schoolClasses[0]?.schoolClass.schoolGrade,
                cfo: cfo
                  ? Math.round(cfo.toNumber()).toString().concat('%')
                  : '0%',
                sea: sea
                  ? Math.round(sea.toNumber()).toString().concat('%')
                  : '0%',
                lct: lct
                  ? Math.round(lct.toNumber()).toString().concat('%')
                  : '0%',
                status: student.status,
              };
            },
          );

          const filteredStudents = responseStudents.filter((student) => {
            if (cfo !== undefined && cfo !== '') {
              const cfoValue = parseFloat(student.cfo.replace('%', ''));
              if (cfoValue < cfo) {
                return false;
              }
            }

            if (sea !== undefined && sea !== '') {
              const seaValue = parseFloat(student.sea.replace('%', ''));
              if (seaValue < sea) {
                return false;
              }
            }

            if (lct !== undefined && lct !== '') {
              const lctValue = parseFloat(student.lct.replace('%', ''));
              if (lctValue < lct) {
                return false;
              }
            }
            return true;
          });

          return new PaginationResponse(filteredStudents, pagination);
        } catch (error) {
          throw new EduException('DATABASE_ERROR');
        }
      } catch (error) {
        throw new EduException('DATABASE_ERROR');
      }
    }
  }

  async userClasses(userId: string): Promise<string[]> {
    const uniqueClassIds = await this.prisma.userSchoolClass.findMany({
      where: { userId },
      select: {
        schoolClassId: true,
      },
      distinct: ['schoolClassId'],
    });

    return uniqueClassIds.map(({ schoolClassId }) => schoolClassId);
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

  async getSchoolGradeByStudentId(id: string): Promise<SchoolGradeEnum> {
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

    const { schoolClasses } = student;

    const schoolClass = schoolClasses[0]?.schoolClass;

    return schoolClass?.schoolGrade ?? null;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentRequestDto,
  ): Promise<StudentResponseDto> {
    const { name, registry, status, schoolClassId } = updateStudentDto;

    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: schoolClassId },
      include: { schoolYear: true },
    });

    if (!schoolClass) {
      throw new EduException('SCHOOL_CLASS_NOT_FOUND');
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        name,
        registry,
        status,
        schoolClasses: {
          deleteMany: { studentId: id },
          create: {
            schoolClass: { connect: { id: schoolClassId } },
          },
        },
      },
      include: {
        schoolClasses: { include: { schoolClass: true } },
      },
    });

    const studentExam = await this.studentExamModel.findOne({
      id,
      current: true,
    });

    if (!studentExam) {
      await this.createExamStudant(id);
    }

    const schollYear = await this.getSchoolYearNameFromClassId(schoolClass.id);
    this.dashboard.updateDashboardData(schollYear).then();

    return {
      id: updatedStudent.id,
      name: updatedStudent.name,
      registry: updatedStudent.registry,
      schoolClassId: schoolClass?.id || null,
      schoolClassName: schoolClass?.name || null,
      schoolPeriod: schoolClass?.schoolPeriod || null,
      schoolGrade: schoolClass?.schoolGrade || null,
      status: updatedStudent.status,
    };
  }

  async delete(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new EduException('IDS_REQUIRED');
    }

    const schoolClassIds = await this.getSchoolClassIdsByStudentIds(ids);
    const schoolYearNames = await this.getSchoolYearNamesBySchoolClassIds(
      schoolClassIds,
    );

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

    this.dashboard.updateDashboardDataArray(schoolYearNames).then();
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

  async getSchoolYearNameFromClassId(classId: string): Promise<number> {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      include: { schoolYear: true },
    });

    if (!schoolClass) {
      throw new Error('SchoolClass not found.');
    }

    return schoolClass.schoolYear.name;
  }

  async getSchoolClassIdsByStudentIds(studentIds: string[]): Promise<string[]> {
    const userSchoolClasses = await this.prisma.schoolClassStudent.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
      },
      select: {
        schoolClassId: true,
      },
    });

    return userSchoolClasses.map((item) => item.schoolClassId);
  }

  async getSchoolYearNamesBySchoolClassIds(
    schoolClassIds: string[],
  ): Promise<number[]> {
    const schoolClasses = await this.prisma.schoolClass.findMany({
      where: {
        id: {
          in: schoolClassIds,
        },
      },
      select: {
        schoolYear: {
          select: {
            name: true,
          },
        },
      },
    });

    const schoolYearNames = schoolClasses.map((item) => item.schoolYear.name);

    return [...new Set(schoolYearNames)];
  }

  async getFirstQuestionForStudent(studentId: string): Promise<QuestionDto> {
    await this.prisma.schoolClassStudent.updateMany({
      where: {
        studentId: studentId,
      },
      data: {
        firstAccess: false,
      },
    });

    const schoolGradeYear = await this.getSchoolGradeYear(studentId);

    const schoolGradeEnum = await this.getSchoolGradeByStudentId(studentId);
    const axisCode = schoolGradeEnum === SchoolGradeEnum.CHILDREN ? 'ES' : 'EA';
    const questionsByAxisCode = await this.getQuestionsByAxisCode(
      axisCode,
      schoolGradeYear,
      studentId,
    );

    if (questionsByAxisCode == null) {
      throw new EduException('QUESTION_NOT_FOUND');
    }

    questionsByAxisCode.progress = await this.recoverProgress(
      studentId,
      schoolGradeYear,
    );

    questionsByAxisCode.options = this.shuffleOptions(
      questionsByAxisCode.options,
    );
    return questionsByAxisCode;
  }

  async getQuestionsByAxisCode(
    axisCode: string,
    schoolGradeYear: number,
    studentId: string,
  ): Promise<QuestionDto> {
    try {
      const exam = await this.examModel.findOne({
        'questions.axis_code': axisCode,
        'questions.category': 'A',
        'questions.school_year': { $lte: schoolGradeYear },
      });

      if (!exam) {
        throw new EduException('QUESTION_NOT_FOUND');
      }

      let studentExam = await this.studentExamModel.findOne({
        studentId: studentId,
        examId: exam.id,
        current: true,
      });

      if (!studentExam) {
        await this.createExamStudant(studentId);
        studentExam = await this.studentExamModel.findOne({
          studentId: studentId,
          examId: exam.id,
          current: true,
        });
      }

      if (studentExam.examPerformed == false && studentExam.current == true) {
        studentExam.answers = [];
        await studentExam.save();
      }

      // Filtra as questões pelo axis_code e pela category 'A'
      const filteredQuestions = exam.questions.filter(
        (question) =>
          question.axis_code === axisCode && question.category === 'A',
      );

      // Ordena as questões pelo atributo 'order' em ordem crescente
      const sortedQuestions = filteredQuestions.sort(
        (a, b) => a.order - b.order,
      );

      // Obtém apenas o primeiro elemento do array de questões
      const firstQuestion = sortedQuestions[0];

      // Mapeia o primeiro elemento para o formato do QuestionDto
      return {
        id: firstQuestion.id,
        axis_code: firstQuestion.axis_code,
        order: firstQuestion.order,
        category: firstQuestion.category,
        school_year: firstQuestion.school_year,
        level: firstQuestion.level,
        description: firstQuestion.description,
        model_id: firstQuestion.model_id,
        titles: firstQuestion.titles,
        options: firstQuestion.options,
        orderedAnswer: firstQuestion.orderedAnswer,
      };
    } catch (error) {
      console.log(error);
      throw new EduException('DATABASE_ERROR');
    }
  }

  async handleExamEvaluation(
    studentId: string,
  ): Promise<ExamEvaluationResponseDto> {
    let planets: PlanetDocument[] = [];

    const studentExam = await this.studentExamModel.findOne({
      studentId: studentId,
      current: true,
    });
    const student = await this.getStudent(studentId);
    const schoolGradeYear = await this.getSchoolGradeByStudentId(studentId);

    const axisCodes = ['ES', 'EA', 'LC'];
    for (const axis_code of axisCodes) {
      const studentExamResult = {
        percentage: await this.calculatePercentage(studentId, axis_code),
        level: await this.findStudentLevel(studentId, axis_code),
        axisCode: axis_code,
        studentId: studentId,
        resume: '',
        examDate: studentExam.examDate,
      };
      studentExamResult.resume = this.getStudentAxisResume(
        studentExamResult.level,
        axis_code,
        schoolGradeYear,
        student.name,
      );
      await this.saveStudentExamResult(studentExamResult);

      if (studentExamResult.percentage < 100) {
        planets = [
          ...planets,
          ...(await this.getPlanetsByAxisAndLevel(
            axis_code,
            studentExamResult.level,
          )),
        ];
      }
    }

    await this.generateAndSavePlanetTrack(studentId, planets);

    await this.studentAward.verifyAndGenerateExamAwards(studentId);

    return null;
  }

  async syncPlanetStudent(): Promise<void> {
    try {
      console.log('Sync Planet Student - Sincronizando Planetas do Aluno');
      const allStudents = await this.getAllStudents();

      await Promise.all(
        allStudents.map(async (student) => {
          const studentExam = await this.studentExamModel.findOne({
            studentId: student.id,
            current: true,
            examDate: { $ne: null },
          });

          if (studentExam) {
            const axisCodes = ['ES', 'EA', 'LC'];
            const planets: PlanetDocument[] = [];

            for (const axisCode of axisCodes) {
              const studentLevel = await this.findStudentLevel(
                student.id,
                axisCode,
              );
              const axisPlanets = await this.getPlanetsByAxisAndLevel(
                axisCode,
                studentLevel,
              );
              planets.push(...axisPlanets);
            }

            await this.generateAndSavePlanetTrack(student.id, planets);
          }
        }),
      );
      console.log('Sync Planet Student - Planetas do Aluno Sincronizados');
    } catch (error) {
      console.error('Erro ao sincronizar alunos e planetas:', error);
    }
  }

  async getAllStudents(): Promise<Student[]> {
    try {
      return await this.prisma.student.findMany();
    } catch (error) {
      console.error('Erro ao obter todos os alunos:', error);
      throw new Error('Erro ao obter todos os alunos');
    }
  }

  async authorizeNewExam(
    requestDto: AuthorizeNewExamRequestDto,
  ): Promise<AuthorizeNewExamResponseDto> {
    const { ids } = requestDto;

    if (!ids || ids.length === 0) {
      throw new EduException('IDS_REQUIRED');
    }

    // Desativar execuções de prova anteriores (studentexams.current = false);
    const oldStudentExams = await this.studentExamModel.find({
      studentId: { $in: ids },
    });

    oldStudentExams.forEach((item) => {
      item.current = false;
      item.save();
    });

    // Criar e persistir novo documento de studentexams, com as devidas propriedades
    const result = await this.createManyExamStudant(ids);

    // Retorar response adequado
    return { success: result };
  }

  private async getStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
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

    return student;
  }

  async getSchoolGradeYear(studentId: string) {
    const student = await this.getStudent(studentId);
    const schoolGradeYear = student.schoolClasses[0].schoolClass.schoolGrade;
    return Object.keys(SchoolGradeEnum).indexOf(schoolGradeYear);
  }

  async releasePlanets(studentId: string): Promise<any> {
    // Obtém studentexam com a execução de prova atual
    const studentExam = await this.studentExamModel.findOne({
      studentId: studentId,
      lastExam: true,
    });

    let counter = 1;
    const nextAvaiableDate = new Date();
    nextAvaiableDate.setHours(0, 0, 0, 0);

    const plantTrackToUpdate = studentExam.planetTrack;

    studentExam.planetTrack
      .filter((item) => item.availableAt > new Date())
      .forEach((item) => {
        item.availableAt = new Date(nextAvaiableDate.toISOString());

        if (counter == 2) {
          // 2 = quantidade de planetas que está sendo liberada
          nextAvaiableDate.setDate(nextAvaiableDate.getDate() + 1);
          counter = 1;
        } else {
          counter++;
        }
      });

    studentExam.planetTrack = plantTrackToUpdate.sort(
      (a, b) => a.order - b.order,
    );

    await studentExam.save();
  }

  private async getPlanetsByAxisAndLevel(
    axis_code: string,
    level: string,
  ): Promise<PlanetDocument[]> {
    // Obtendo planetas para o aluno através do level
    const planets = await this.planetModel.find({
      axis_code: axis_code,
      level: level,
    });
    return planets;
  }

  // Criar trilha de planetas para o aluno
  async generateAndSavePlanetTrack(
    studentId: string,
    planets: PlanetDocument[],
  ): Promise<any> {
    if (planets.length == 0) {
      return;
    }

    // Recuperando studentexam do aluno
    const studentExam = await this.studentExamModel.findOne({
      studentId,
      current: true,
    });

    if (!studentExam) {
      throw new EduException('USER_NOT_FOUND');
    }

    // Ordenando planetas que possuem planeta agregado primeiro
    planets = planets.sort((a: any, b: any) => {
      return a.position - b.position;
    });

    // Aplicando lógica de ordenação da trilha de planetas
    const planetTrackToSave: Planet[] = [];
    const axisCodes = ['ES', 'EA', 'LC'];
    for (let index = 0; index < planets.length; index++) {
      axisCodes.forEach((axis_code) => {
        this.addByAxisCode(axis_code, planets, planetTrackToSave);
      });
    }

    // Definindo disponibilidade dos planetas
    this.setPlanetTrackAvailability(planetTrackToSave);

    // Persistindo planetTrack ordenada
    studentExam.planetTrack = planetTrackToSave;
    await studentExam.save();
  }

  private setPlanetTrackAvailability(planetTrack: Planet[]) {
    const nextAvaiableDate = new Date();
    nextAvaiableDate.setHours(0, 0, 0, 0);

    for (let index = 0; index < planetTrack.length; index += 2) {
      planetTrack[index].availableAt = new Date(nextAvaiableDate.toISOString());
      if (index + 1 < planetTrack.length) {
        planetTrack[index + 1].availableAt = new Date(
          nextAvaiableDate.toISOString(),
        );
        nextAvaiableDate.setDate(nextAvaiableDate.getDate() + 1);
      }
    }
  }

  private addByAxisCode(
    axis_code: string,
    planets: PlanetDocument[],
    planetTrackToSave: Planet[],
  ) {
    const planetIdsAlreadyProcessed = planetTrackToSave.map(
      (item) => item.planetId,
    );
    const planet = planets.find(
      (item) =>
        item.axis_code == axis_code &&
        !planetIdsAlreadyProcessed.includes(item.id),
    );

    if (planet) {
      planetTrackToSave.push({
        planetId: planet.id,
        planetName: planet.title,
        planetAvatar: planet.avatar_url,
        axis_code: axis_code,
        order: planetTrackToSave.length,
        level: planet.level,
        position: planet.position,
        answers: [],
      } as Planet);

      this.checkForNextPlanet(planet, planets, planetTrackToSave);
    }
  }

  private checkForNextPlanet(
    planet: PlanetDocument,
    planets: PlanetDocument[],
    planetTrackToSave: Planet[],
  ) {
    if (planet.next_planet_id !== null) {
      const planetIdsAlreadyProcessed = planetTrackToSave.map(
        (item) => item.planetId,
      );
      const nextPlanetToSave = planets.find(
        (item) =>
          item.id === planet.next_planet_id &&
          !planetIdsAlreadyProcessed.includes(item.next_planet_id),
      );

      if (nextPlanetToSave) {
        planetTrackToSave.push({
          planetId: nextPlanetToSave.id,
          planetName: nextPlanetToSave.title,
          planetAvatar: nextPlanetToSave.avatar_url,
          axis_code: nextPlanetToSave.axis_code,
          order: planetTrackToSave.length,
          level: planet.level,
          answers: [],
        } as Planet);

        this.checkForNextPlanet(nextPlanetToSave, planets, planetTrackToSave);
      }
    }
  }

  private async calculatePercentage(
    studentId: string,
    axisCode: string,
  ): Promise<number> {
    try {
      const student = await this.studentExamModel.findOne({
        studentId: studentId,
        current: true,
      });

      if (!student) {
        return 0;
      }

      const studentAxisAnswers = student.answers.filter(
        (item) => item.axis_code == axisCode,
      );
      const allOrders = studentAxisAnswers.map((item) => item.order);
      const uniqueOrders = [...new Set(allOrders)];

      const correctAnswerOrderList = [];
      for (let index = 0; index < uniqueOrders.length; index++) {
        const answerOrder = studentAxisAnswers.find(
          (answer) =>
            answer.order == uniqueOrders[index] && answer.isCorrect == true,
        );
        if (answerOrder != undefined && answerOrder != null) {
          correctAnswerOrderList.push(answerOrder);
        }
      }

      const totalCorrectAnswers = correctAnswerOrderList.length;
      const totalQuestions = uniqueOrders.length;

      const percentage = (totalCorrectAnswers / totalQuestions) * 100;

      if (isNaN(percentage)) {
        return 0;
      }

      return parseFloat(percentage.toFixed(2));
    } catch (error) {
      console.error('Error in calculatePercentage:', error);
      throw new Error('An error occurred while calculating percentage.');
    }
  }

  private async findStudentLevel(
    studentId: string,
    axisCode: string,
  ): Promise<string> {
    try {
      const studentExam = await this.studentExamModel.findOne({
        studentId: studentId,
        current: true,
      });
      const lastAnswer = studentExam.answers
        .filter(
          (item) =>
            item.axis_code == axisCode && item.autoAssignedAnswer == false,
        )
        .sort(
          (a, b) => b.order - a.order || b.category.localeCompare(a.category),
        )[0];

      const schoolGradeYear = await this.getSchoolGradeYear(studentId);

      if (lastAnswer == null) {
        if (schoolGradeYear > 0) {
          return '1';
        } else {
          return '0';
        }
      }

      if (lastAnswer.lastQuestion && lastAnswer.isCorrect) {
        return 'IDEAL';
      }

      if (schoolGradeYear == 0) {
        return '0';
      }

      return lastAnswer.level.toString();
    } catch (error) {
      console.error('Error in findStudentLevel:', error);
      throw new Error('An error occurred while finding student level.');
    }
  }

  private getStudentAxisResume(
    level: string,
    axis_code: string,
    school_year: SchoolGradeEnum,
    studentName: string,
  ) {
    const examResumes = new ExamResumes();

    level = level == '0' ? '1' : level;

    const resume = examResumes.Templates.find(
      (item) =>
        item.level == level &&
        item.axis_code == axis_code &&
        item.school_year == school_year,
    );

    return resume.text.replaceAll(examResumes.ReplaceTerm, studentName);
  }

  // Persistir registro student_examResult
  private async saveStudentExamResult(studentExamResult: {
    axisCode: string;
    percentage: number;
    level: string;
    studentId: string;
    resume: string;
  }): Promise<any> {
    const studentExam = await this.studentExamModel.findOne({
      studentId: studentExamResult.studentId,
      current: true,
    });

    try {
      const createdStudentExamResult =
        await this.prisma.studentExamResult.upsert({
          where: {
            studentExamId_axisCode_studentId: {
              studentExamId: studentExam.id,
              axisCode: studentExamResult.axisCode,
              studentId: studentExamResult.studentId,
            },
          },
          update: {
            percent: studentExamResult.percentage,
            level: studentExamResult.level,
            resume: studentExamResult.resume,
          },
          create: {
            studentExamId: studentExam.id,
            axisCode: studentExamResult.axisCode,
            percent: studentExamResult.percentage,
            level: studentExamResult.level,
            resume: studentExamResult.resume,
            student: {
              connect: { id: studentExamResult.studentId },
            },
          },
        });
    } catch (e) {
      console.log(e);
    }
  }

  async answer(
    studentId: string,
    examId: string,
    answerRequestDto: AnswerRequestDto,
  ): Promise<QuestionDto | AnswersResponseDto> {
    try {
      const aggregationResult: any[] = await this.examModel
        .aggregate([
          {
            $match: { 'questions.id': answerRequestDto.questionId },
          },
          {
            $project: {
              questions: {
                $filter: {
                  input: '$questions',
                  as: 'question',
                  cond: { $eq: ['$$question.id', answerRequestDto.questionId] },
                },
              },
            },
          },
        ])
        .exec();

      let response;

      const question: QuestionDto = aggregationResult[0].questions[0];

      if (question == null) {
        throw new EduException('QUESTION_NOT_FOUND');
      }

      const isCorrect = await this.verifyAnswer(
        question,
        answerRequestDto.optionsAnswered,
      );

      const schoolGradeYear = await this.getSchoolGradeYear(studentId);

      const checkAxisRemainingQuestions =
        await this.checkAxisRemainingQuestions(
          question.order + 1,
          question.axis_code,
          schoolGradeYear,
        );

      examId = await this.getCurrentExamId();

      await this.saveAnswer(
        studentId,
        examId,
        question,
        answerRequestDto.optionsAnswered,
        isCorrect,
        !checkAxisRemainingQuestions,
      );

      if (isCorrect) {
        if (checkAxisRemainingQuestions) {
          response = await this.getNextAxisQuestion(
            question.order + 1,
            question.axis_code,
            'A',
            schoolGradeYear,
          );
        } else {
          response = await this.getNextQuestionFromAxis(
            question.axis_code,
            studentId,
            examId,
            schoolGradeYear,
          );
        }
      } else {
        let checkQuestionBSecondAttempt = false;
        if (question.category === 'A') {
          checkQuestionBSecondAttempt = await this.checkAxisRemainingQuestions(
            question.order,
            question.axis_code,
            schoolGradeYear,
          );
        }
        if (checkQuestionBSecondAttempt) {
          response = await this.getNextAxisQuestion(
            question.order,
            question.axis_code,
            'B',
            schoolGradeYear,
          );
        } else {
          await this.assignWrongAnswersToRemainingAxisQuestions(
            studentId,
            examId,
            question.order,
            question.axis_code,
            schoolGradeYear,
          );
          response = await this.getNextQuestionFromAxis(
            question.axis_code,
            studentId,
            examId,
            schoolGradeYear,
          );
        }
      }

      response.progress = await this.recoverProgress(
        studentId,
        schoolGradeYear,
      );

      response.options = this.shuffleOptions(response.options);
      return response;
    } catch (error) {
      console.log(error);
      throw new EduException('UNKNOWN_ERROR');
    }
  }

  private async getCurrentExamId() {
    const exam = await this.examModel.findOne({ status: 'ACTIVE' });
    return exam.id;
  }

  private shuffleOptions(options: any): any {
    if (options == undefined || options == null || options.length == 0) {
      return options;
    }

    const originalOptions = JSON.parse(JSON.stringify(options));

    if (options != undefined && options != null && options.length > 0) {
      let currentIndex = options.length,
        randomIndex;
      while (currentIndex != 0) {
        const random = Math.random();
        randomIndex = Math.floor(random * currentIndex);
        currentIndex--;

        [options[currentIndex], options[randomIndex]] = [
          options[randomIndex],
          options[currentIndex],
        ];
      }
    }

    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = options[i];
      options[i] = options[j];
      options[j] = temp;
    }

    const originalPositions = originalOptions.map((option) => option.position);
    const positionsShuffle = options.map((option) => option.position);

    if (originalPositions == positionsShuffle) {
      options = this.shuffleOptions(options);
    }

    return options;
  }

  async recoverProgress(
    studentId: string,
    schoolGradeYear: number,
  ): Promise<number> {
    try {
      const totalQuestionPerAxisAggregate = await this.examModel
        .aggregate([
          {
            $project: {
              questionCount: {
                $size: {
                  $filter: {
                    input: '$questions',
                    as: 'question',
                    cond: {
                      $and: [
                        { $lte: ['$$question.school_year', schoolGradeYear] },
                      ],
                    },
                  },
                },
              },
            },
          },
        ])
        .exec();

      const totalQuestionPerAxis =
        totalQuestionPerAxisAggregate[0]?.questionCount || 0;

      const studentExam = await this.studentExamModel.findOne({
        studentId: studentId,
        current: true,
      });

      const totalQuestionsAnswered = studentExam.answers.length;

      if (totalQuestionPerAxis === 0) {
        return 0;
      }

      const percentage = (totalQuestionsAnswered / totalQuestionPerAxis) * 100;
      return parseFloat(percentage.toFixed(2));
    } catch (error) {
      console.error('Error in recoverProgress:', error);
      return -1; // Or return any suitable error code
    }
  }

  private recoverPlanetProgress(
    currentQuestionPosition: number,
    totalQuestionsPlanet: number,
  ) {
    const percentage = (currentQuestionPosition / totalQuestionsPlanet) * 100;
    return percentage;
  }

  // Salva a resposta no banco de dados studentexams.answer
  async saveAnswer(
    studentId: string,
    examId: string,
    question: QuestionDto,
    answeredOptions: OptionsAnswers[],
    isCorrect: boolean,
    lastQuestion: boolean,
    autoAssignedAnswer = false,
  ): Promise<boolean> {
    try {
      let studentExam = await this.studentExamModel.findOne({
        studentId,
        examId,
        current: true,
      });

      if (!studentExam) {
        await this.createExamStudant(studentId);
        studentExam = await this.studentExamModel.findOne({
          studentId,
          examId,
          current: true,
        });
      }

      if (!studentExam.answers) {
        studentExam.answers = [];
      }

      // Check if an answer with the same questionId already exists
      const existingAnswerIndex = studentExam.answers.findIndex(
        (answer) => answer.questionId === question.id,
      );

      if (existingAnswerIndex !== -1) {
        // Update the existing answer
        studentExam.answers[existingAnswerIndex].optionsAnswered =
          answeredOptions;
      } else {
        // Create a new answer entry
        studentExam.answers.push({
          questionId: question.id,
          isCorrect,
          optionsAnswered: answeredOptions,
          axis_code: question.axis_code,
          level: question.level,
          lastQuestion,
          school_year: question.school_year,
          order: question.order,
          category: question.category,
          autoAssignedAnswer: autoAssignedAnswer,
        });
      }

      await studentExam.save();

      return true;
    } catch (error) {
      console.error('saveAnswer: Error:', error);
      throw new EduException('DATABASE_ERROR');
    }
  }

  // Verificar se questão esta correta
  async verifyAnswer(
    question: QuestionDto,
    answeredValue: OptionAnswer[],
  ): Promise<boolean> {
    try {
      const correctOptions = question.options.filter(
        (option) => option.isCorrect,
      );

      if (correctOptions.length !== answeredValue.length) {
        return false;
      }

      if (!question.orderedAnswer) {
        for (const answeredOption of answeredValue) {
          const matchingOption = correctOptions.find(
            (option) => option.position === answeredOption.position,
          );

          if (
            !matchingOption ||
            matchingOption.position !== answeredOption.position
          ) {
            return false;
          }
        }
      } else {
        for (const answeredOption of answeredValue) {
          const matchingOption = correctOptions.find(
            (option) => option.position === answeredOption.positionAnswer,
          );

          if (
            !matchingOption ||
            matchingOption.position !== answeredOption.position
          ) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('verifyAnswer: Error:', error);
      throw new EduException('DATABASE_ERROR');
    }
  }

  //Verificar se o eixo possui mais questões a serem respondidas
  async checkAxisRemainingQuestions(
    order: number,
    axisCode: string,
    schoolGradeYear: number,
  ): Promise<boolean> {
    const aggregationResult: any[] = await this.examModel
      .aggregate([
        {
          $match: {
            'questions.order': order,
            'questions.axis_code': axisCode,
          },
        },
        {
          $project: {
            questions: {
              $filter: {
                input: '$questions',
                as: 'question',
                cond: {
                  $and: [
                    { $eq: ['$$question.order', order] },
                    { $eq: ['$$question.axis_code', axisCode] },
                    { $lte: ['$$question.school_year', schoolGradeYear] },
                  ],
                },
              },
            },
          },
        },
      ])
      .exec();

    if (aggregationResult.length === 0) {
      return false;
    }
    return aggregationResult[0].questions.length !== 0;
  }

  // Obter a próxima questão do eixo
  async getNextAxisQuestion(
    order: number,
    axisCode: string,
    category: string,
    schoolGradeYear: number,
  ): Promise<QuestionDto | null> {
    const aggregationResult: any[] = await this.examModel
      .aggregate([
        {
          $project: {
            questions: {
              $filter: {
                input: '$questions',
                as: 'question',
                cond: {
                  $and: [
                    { $eq: ['$$question.order', order] },
                    { $eq: ['$$question.axis_code', axisCode] },
                    { $eq: ['$$question.category', category] },
                    { $lte: ['$$question.school_year', schoolGradeYear] },
                  ],
                },
              },
            },
          },
        },
      ])
      .exec();

    if (
      !aggregationResult ||
      aggregationResult.length === 0 ||
      aggregationResult[0].questions.length === 0
    ) {
      return null;
    }

    return aggregationResult[0].questions[0];
  }

  // Obter a próxima questão do eixo seguinte (se houver questão do eixo finaliza a prova)
  async getNextQuestionFromAxis(
    axisCode: string,
    studentId: string,
    examId: string,
    schoolGradeYear: number,
    forcedNextAxis?: string,
  ): Promise<QuestionDto | AnswersResponseDto> {
    let nextAxisCode;

    if (forcedNextAxis != null && forcedNextAxis != '') {
      nextAxisCode = forcedNextAxis;
    } else {
      nextAxisCode = await this.getNextAxisCode(axisCode, schoolGradeYear);
    }

    if (nextAxisCode != null) {
      const aggregationResult: any[] = await this.examModel
        .aggregate([
          {
            $project: {
              questions: {
                $filter: {
                  input: '$questions',
                  as: 'question',
                  cond: {
                    $and: [
                      { $eq: ['$$question.order', 1] },
                      { $eq: ['$$question.category', 'A'] },
                      { $eq: ['$$question.axis_code', nextAxisCode] },
                      { $lte: ['$$question.school_year', schoolGradeYear] },
                    ],
                  },
                },
              },
            },
          },
        ])
        .exec();

      if (!aggregationResult || aggregationResult.length === 0) {
        return null;
      }

      let question = aggregationResult[0].questions[0];

      const wasThereAnAxisJump = await this.handle_EA_To_LC_axisJump(
        axisCode,
        studentId,
        examId,
        schoolGradeYear,
      );
      if (wasThereAnAxisJump) {
        question = await this.getNextQuestionFromAxis(
          'ES',
          studentId,
          examId,
          schoolGradeYear,
          'LC',
        );
      }

      return question;
    } else {
      return await this.finishExam(studentId, examId);
    }
  }

  private async handle_EA_To_LC_axisJump(
    axis_code: string,
    studentId: string,
    examId: string,
    schoolGradeYear: number,
  ): Promise<boolean> {
    let result = false;

    if (axis_code == 'EA' && schoolGradeYear > 0) {
      // - Buscar todas as respostas do eixo EA (Eixo anterior). Se basear no método assignWrongAnswersToRemainingAxisQuestions();
      const studentExam = await this.studentExamModel.findOne({
        studentId: studentId,
        current: true,
      });
      const previousAxisAnswers = studentExam.answers.filter((item) => {
        return item.axis_code == 'EA';
      });

      // - Se todas as respostas estiverem corretas (A ou B são consideradas como corretas):
      //    - Responder corretamente todas as respostas do eixo ES e setar variável result = true;

      const allOrders = previousAxisAnswers.map((item) => item.order);
      const orders = [...new Set(allOrders)];

      let allAnswersAreCorrect = true;
      for (let index = 0; index < orders.length; index++) {
        const isOrderCorrect = previousAxisAnswers.some(
          (answer) => answer.order == orders[index] && answer.isCorrect,
        );
        if (!isOrderCorrect) {
          allAnswersAreCorrect = false;
          break;
        }
      }

      if (allAnswersAreCorrect) {
        const exam = await this.examModel.findOne({ status: 'ACTIVE' });
        const nextAxisQuestions = exam.questions
          .filter((question) => {
            return (
              question.axis_code == 'ES' &&
              question.category == 'A' &&
              question.school_year <= schoolGradeYear
            );
          })
          .sort((a, b) => a.order - b.order);

        if (nextAxisQuestions.length > 0) {
          for (const question of nextAxisQuestions) {
            await this.saveAnswer(
              studentId,
              examId,
              question,
              null,
              true,
              true,
            );
          }
        }

        result = true;
      }
    }

    return new Promise((resolve) => resolve(result));
  }

  private async finishExam(
    studentId: string,
    examId: string,
  ): Promise<AnswersResponseDto> {
    try {
      const studentExam = await this.studentExamModel.findOne({
        studentId,
        examId,
        current: true,
      });

      if (studentExam) {
        studentExam.examDate = new Date();
        studentExam.examPerformed = true;
        studentExam.lastExam = true;
      } else {
        throw new EduException('STUDENT_NOT_FOUND');
      }

      await studentExam.save();

      const oldStudentExams = (
        await this.studentExamModel.find({
          studentId: studentId,
        })
      ).filter((item) => item.id != studentExam.id);

      for (let index = 0; index < oldStudentExams.length; index++) {
        oldStudentExams[index].lastExam = false;
        await oldStudentExams[index].save();
      }

      await this.dashboard.updateDashboardPerformance(studentId, 'EXAM');

      return { examCompleted: true };
    } catch (error) {
      console.error('Erro ao finalizar o exame:', error);
      throw new EduException('FINALIZE_EXAM');
    }
  }

  //Atrbuir respostas erradas para as questões restantes do eixo atual
  async assignWrongAnswersToRemainingAxisQuestions(
    studentId: string,
    examId: string,
    order: number,
    axisCode: string,
    schoolGradeYear: number,
  ): Promise<boolean> {
    try {
      const exam = await this.examModel.findOne({ status: 'ACTIVE' });
      const remainingQuestions = exam.questions
        .filter((question) => {
          return (
            question.axis_code == axisCode &&
            question.order > order &&
            question.school_year <= schoolGradeYear
          );
        })
        .sort((a, b) => a.order - b.order);

      if (remainingQuestions.length > 0) {
        for (const question of remainingQuestions) {
          await this.saveAnswer(
            studentId,
            examId,
            question,
            null,
            false,
            false,
            true,
          );
        }

        console.log(remainingQuestions);
      }

      return true;
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
  }

  //Obter o próximo eixo
  private async getNextAxisCode(
    axisCode: string,
    schoolGradeYear: number,
  ): Promise<string | null> {
    const axisMappingsFirstYear: { [key: string]: string | null } = {
      ES: 'EA',
      EA: 'LC',
      LC: null,
    };

    const axisMappingsAnotherYears: { [key: string]: string | null } = {
      EA: 'ES',
      ES: 'LC',
      LC: null,
    };

    if (schoolGradeYear == 0) {
      return axisMappingsFirstYear[axisCode] || null;
    } else {
      return axisMappingsAnotherYears[axisCode] || null;
    }
  }

  private async createManyExamStudant(studentIds: string[]): Promise<boolean> {
    try {
      const exam = await this.examModel.findOne({ status: 'ACTIVE' });

      if (!exam) {
        console.error('Nenhum exame encontrado');
        throw new EduException('EXAM_NOT_FOUND');
      }

      const studentExams = [];

      studentIds.forEach((studentId) => {
        const studentExam = new this.studentExamModel({
          studentId: studentId,
          examId: exam.id,
          examDate: null,
          current: true,
          examPerformed: false,
          planetTrack: [],
          answers: [],
        });

        studentExams.push(studentExam);
      });

      await this.studentExamModel.create(studentExams);

      return true;
    } catch (error) {
      console.error('Erro ao criar os studentexams:', error);
      throw new EduException('STUDENT_CREATION_FAILED');
    }
  }

  private async createExamStudant(studentId: string): Promise<boolean> {
    try {
      const exam = await this.examModel.findOne({ status: 'ACTIVE' });

      if (!exam) {
        console.error('Nenhum exame encontrado');
        throw new EduException('EXAM_NOT_FOUND');
      }

      const studentExam = new this.studentExamModel({
        studentId: studentId,
        examId: exam.id,
        examDate: null,
        current: true,
        examPerformed: false,
        planetTrack: [],
        answers: [],
      });

      await studentExam.save();

      return true;
    } catch (error) {
      console.error('Erro ao finalizar o exame:', error);
      throw new EduException('STUDENT_CREATION_FAILED');
    }
  }

  async getFirstQuestionPlanetForStudent(
    studentId: string,
    planetId: string,
  ): Promise<QuestionPlanentDto> {
    const planetTrack: any[] = await this.studentExamModel
      .aggregate([
        {
          $match: {
            'planetTrack.planetId': planetId,
          },
        },
        {
          $project: {
            questions: {
              $filter: {
                input: '$planetTrack',
                as: 'planetTrack',
                cond: {
                  $and: [{ $eq: ['$$planetTrack.planetId', planetId] }],
                },
              },
            },
          },
        },
      ])
      .exec();

    if (planetTrack.length === 0) {
      throw new EduException('KIDS_WITHOUT_PLANETS');
    }

    const question = await this.getQuestionByPlanetIdAndPosition(planetId, 0);
    question.options = this.applyPlanetQuestionShuffle(question);
    question.progress = 0;

    if (question === null) {
      throw new EduException('QUESTION_NOT_FOUND');
    }
    return question;
  }

  async answerPlanet(
    studentId: string,
    planetId: string,
    answersPlanet: AnswersPlanet,
  ): Promise<AnswersPlanetResponseDto | QuestionPlanentDto> {
    const planet = await this.planetModel.findOne({ id: planetId });

    let questionAnswered = await this.getQuestionByPlanetId(
      planetId,
      answersPlanet.questionId,
    );

    questionAnswered =
      this.studentPlanetExecution.handleCustomQuestion(questionAnswered);

    answersPlanet = this.studentPlanetExecution.interceptCustomAnswer(
      answersPlanet,
      questionAnswered,
    );

    const skipVerify =
      answersPlanet.optionsAnswered.length == 0 ||
      (!questionAnswered.orderedAnswer &&
        questionAnswered.options.every((option) => {
          return (
            (option.position === null && !option.isCorrect) || !option.isCorrect
          );
        }));

    if (!skipVerify) {
      const isCorrect = this.studentPlanetExecution.verifyAnswerPlanet(
        questionAnswered,
        answersPlanet.optionsAnswered,
      );
      answersPlanet.isCorrect = isCorrect;

      await this.saveAnswerPlanet(studentId, planetId, answersPlanet);

      const nextQuestion = await this.getQuestionByPlanetIdAndPosition(
        planetId,
        questionAnswered.position + 1,
      );

      if (nextQuestion === null || nextQuestion === undefined) {
        return await this.finishPlanet(studentId, planetId, isCorrect);
      }

      nextQuestion.options = this.applyPlanetQuestionShuffle(nextQuestion);

      nextQuestion.previousQuestionIsCorrect = isCorrect;
      nextQuestion.progress = this.recoverPlanetProgress(
        questionAnswered.position + 1,
        planet.questions.length,
      );
      return nextQuestion;
    } else {
      // Verifica se existe próxima questão do planeta, considerando a propriedade position+1 da questão respondida (questão que chega).
      const nextQuestion = await this.getQuestionByPlanetIdAndPosition(
        planetId,
        questionAnswered.position + 1,
      );

      if (nextQuestion === null || nextQuestion === undefined) {
        return await this.finishPlanet(studentId, planetId);
      }
      nextQuestion.options = this.applyPlanetQuestionShuffle(nextQuestion);
      // Se entrou nesse else, é porque não deve ser verificado se a questão foi respondida corretamente.
      // Logo, retornamos true e boa.
      nextQuestion.previousQuestionIsCorrect = true;
      nextQuestion.progress = this.recoverPlanetProgress(
        questionAnswered.position + 1,
        planet.questions.length,
      );
      return nextQuestion;
    }
  }

  private applyPlanetQuestionShuffle(planetQuestion: any): any {
    switch (planetQuestion.model_id) {
      case 'MODEL12':
        const shuffleRule = planetQuestion.rules.find(
          (rule) => rule.name === 'shuffle',
        );
        if (
          shuffleRule == undefined ||
          JSON.parse(shuffleRule.value.toLowerCase())
        ) {
          planetQuestion.options = this.shuffleOptions(planetQuestion.options);
        }
        break;
      case 'MODEL24':
        if (planetQuestion.options.length > 2) {
          planetQuestion.options = this.shuffleOptions(planetQuestion.options);
        }
        break;
      case 'MODEL4':
      case 'MODEL10':
      case 'MODEL11':
      case 'MODEL32':
      case 'MODEL13':
      case 'MODEL18':
      case 'MODEL5':
      case 'MODEL2':
      case 'MODEL8':
      case 'MODEL26':
      case 'MODEL34':
      case 'MODEL25':
      case 'MODEL19':
      case 'MODEL28':
      case 'MODEL31':
      case 'MODEL29':
        planetQuestion.options = this.shuffleOptions(planetQuestion.options);
        break;
      default:
        break;
    }

    return planetQuestion.options;
  }

  private async finishPlanet(
    studentId: string,
    planetId: string,
    previousQuestionIsCorrect = true,
  ): Promise<AnswersPlanetResponseDto> {
    const planet = await this.planetModel.findOne({ id: planetId });

    const studentExam = await this.studentExamModel.findOne({
      studentId: studentId,
      lastExam: true,
    });
    const stars = await this.calculateStars(studentId, planetId);

    await this.saveStudentPlanetResult(
      studentId,
      studentExam.id,
      planetId,
      planet.title,
      planet.axis_code,
      stars,
    );

    await this.studentAward.verifyAndGeneratePlanetAwards(studentId);
    await this.dashboard.updateDashboardPerformancePlanet(studentId, 'PLANET');

    return {
      planetCompleted: true,
      previousQuestionIsCorrect: previousQuestionIsCorrect,
      progress: 100,
    };
  }

  async saveStudentPlanetResult(
    studentId: string,
    studentExamId: string,
    planetId: string,
    planetName: string,
    axisCode: string,
    stars: number,
  ): Promise<StudentPlanetResult> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return this.prisma.studentPlanetResult.upsert({
      where: {
        studentExamId_planetId_studentId: {
          studentExamId: studentExamId,
          planetId: planetId,
          studentId: studentId,
        },
      },
      update: {
        planetId: planetId,
        stars: stars,
      },
      create: {
        studentExamId: studentExamId,
        planetId: planetId,
        planetName: planetName,
        stars: stars,
        axisCode: axisCode,
        student: { connect: { id: studentId } },
      },
    });
  }

  private async calculateStars(studentId: string, planetId: string) {
    const studentExam = await this.studentExamModel.findOne({
      studentId,
      lastExam: true,
    });

    if (!studentExam) {
      throw new NotFoundException(
        `Student exam not found for student ID: ${studentId}`,
      );
    }

    const planet = studentExam.planetTrack.find((p) => p.planetId === planetId);

    if (!planet) {
      throw new NotFoundException(
        `Planet not found for planet ID: ${planetId}`,
      );
    }

    const totalAnswers = planet.answers.length;
    const totalCorrectAnswers = planet.answers.filter(
      (answer) => answer.isCorrect,
    ).length;

    const score = (totalCorrectAnswers / totalAnswers) * 5;
    const start = Math.max(0, Math.min(5, score));
    return parseFloat(start.toFixed(2));
  }

  async getQuestionByPlanetId(
    planetId: string,
    questionId: string,
  ): Promise<QuestionPlanentDto> {
    const question = await this.planetModel
      .aggregate([
        {
          $match: {
            id: planetId,
          },
        },
        {
          $project: {
            question: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$questions',
                    as: 'questions',
                    cond: {
                      $eq: ['$$questions.id', questionId],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
      ])
      .exec();

    return question[0].question;
  }

  async getQuestionByPlanetIdAndPosition(
    planetId: string,
    position: number,
  ): Promise<QuestionPlanentDto> {
    const question = await this.planetModel
      .aggregate([
        {
          $match: {
            id: planetId,
          },
        },
        {
          $project: {
            question: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$questions',
                    as: 'questions',
                    cond: {
                      $eq: ['$$questions.position', position],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
      ])
      .exec();

    return question[0].question;
  }

  private async saveAnswerPlanet(
    studentId: string,
    planetId: string,
    answersPlanet: AnswersPlanet,
  ): Promise<boolean> {
    try {
      const filter = {
        studentId,
        'planetTrack.planetId': planetId,
        lastExam: true,
      };

      const update = {
        $push: { 'planetTrack.$.answers': answersPlanet },
      };

      const options = { new: true };

      const updatedDocument = await this.studentExamModel.findOneAndUpdate(
        filter,
        update,

        options,
      );

      if (!updatedDocument) {
        throw new Error('Document not found');
      }

      return true;
    } catch (error) {
      console.error('saveAnswerPlanet: Error:', error);
      throw new EduException('DATABASE_ERROR');
    }
  }
}
