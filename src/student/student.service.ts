import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentRequestDto } from './dto/request/create-student-request.dto';
import { UpdateStudentRequestDto } from './dto/request/update-student-request.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import { Prisma, SchoolGradeEnum, Status } from '@prisma/client';
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
  OptionsAnswers,
  Planet,
  StudentExam,
  StudentExamDocument,
} from './schemas/studentExam.schema';
import { ExamEvaluationResponseDto } from './dto/response/exam-evaluation-response.dto';
import { PlanetDocument } from 'src/planet-sync/schemas/planet.schema';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: DashboardService,
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

    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: schoolClassId },
      include: { schoolYear: true },
    });

    if (!schoolClass) {
      throw new EduException('SCHOOL_CLASS_NOT_FOUND');
    }

    const createdStudent = await this.prisma.student.create({
      data: {
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

    const schoolGradeEnum = await this.getSchoolGradeByStudentId(studentId);
    const axisCode = schoolGradeEnum === SchoolGradeEnum.CHILDREN ? 'ES' : 'EA';
    const questionsByAxisCode = await this.getQuestionsByAxisCode(axisCode);

    if (questionsByAxisCode == null) {
      throw new EduException('QUESTION_NOT_FOUND');
    }

    return questionsByAxisCode;
  }

  async getQuestionsByAxisCode(axisCode: string): Promise<QuestionDto> {
    try {
      const exam = await this.examModel.findOne({
        'questions.axis_code': axisCode,
        'questions.category': 'A',
      });

      if (!exam) {
        throw new EduException('QUESTION_NOT_FOUND');
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
      throw new EduException('DATABASE_ERROR');
    }
  }

  async handleExamEvaluation(
    studentId: string,
  ): Promise<ExamEvaluationResponseDto> {
    let planets: PlanetDocument[] = [];

    const axisCodes = ['ES', 'EA', 'LC'];
    for (const axis_code of axisCodes) {
      const studentExamResult = {
        percentage: await this.calculatePercentage(studentId, axis_code),
        level: await this.findStudentLevel(),
      };
      await this.saveStudentExamResult(studentExamResult);

      planets = [ ...planets, ...(await this.getPlanetsByAxisAndLevel(studentId, axis_code, studentExamResult.level))];
    }

    await this.generateAndSavePlanetTrack(studentId, planets);

    return null;
  }

  private async getPlanetsByAxisAndLevel(studentId: string, axis_code: string, level: string): Promise<PlanetDocument[]> {
    // Obtendo planetas para o aluno através do level
    const planets = await this.planetModel.find({ axis_code: axis_code, level: level });
    return planets;
  }

  // Criar trilha de planetas para o aluno
  private async generateAndSavePlanetTrack(studentId: string, planets: PlanetDocument[]): Promise<any> {
    // Recuperando studentexam do aluno
    let studentExam = await this.studentExamModel.findOne({ studentId });

    if (!studentExam) {
      throw new EduException('USER_NOT_FOUND');
    }

    // Ordenando planetas que possuem planeta agregado primeiro
    planets = planets.sort((a: any, b: any) => {
      if (a.next_planet_id === null) {
        return 1;
      }
      if (b.next_planet_id === null) {
        return -1
      }
    });

    // Aplicando lógica de ordenação da trilha de planetas
    let planetTrackToSave: Planet[] = [];
    const axisCodes = [ 'ES', 'EA', 'LC' ];
    for (let index = 0; index < planets.length; index++) {

      axisCodes.forEach((axis_code) => {
        this.addByAxisCode(axis_code, planets, planetTrackToSave);
      });

    }

    // Persistindo planetTrack ordenada
    studentExam.planetTrack = planetTrackToSave;
    await studentExam.save();
  }

  private addByAxisCode(axis_code: string, planets: PlanetDocument[], planetTrackToSave: Planet[]) {
    const planetIdsAlreadyProcessed = planetTrackToSave.map((item) => item.planetId);
    const planet = planets.find((item) => item.axis_code == axis_code && !planetIdsAlreadyProcessed.includes(item.id));

    if (planet) {
      planetTrackToSave.push({
        planetId: planet.id,
        planetName: planet.title,
        planetAvatar: planet.avatar_url,
        score: 0,
        stars: 0,
        axis_code: axis_code,
        order: planetTrackToSave.length
      } as Planet);

      this.checkForNextPlanet(planet, planets, planetTrackToSave);
    }
  }

  private checkForNextPlanet(planet: PlanetDocument, planets: PlanetDocument[], planetTrackToSave: Planet[]) {
    if (planet.next_planet_id !== null) {

      const planetIdsAlreadyProcessed = planetTrackToSave.map((item) => item.planetId);
      let nextPlanetToSave = planets.find((item) => item.id === planet.next_planet_id && !planetIdsAlreadyProcessed.includes(item.next_planet_id));

      if (nextPlanetToSave) {
        planetTrackToSave.push({
          planetId: nextPlanetToSave.id,
          planetName: nextPlanetToSave.title,
          planetAvatar: nextPlanetToSave.avatar_url,
          score: 0,
          stars: 0,
          axis_code: nextPlanetToSave.axis_code,
          order: planetTrackToSave.length
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
      });

      const exam = await this.examModel.findOne({
        id: student?.examId,
      });

      if (!student || !exam || !exam.questions || exam.questions.length === 0) {
        return 0;
      }

      const correctQuestionsCount = await this.studentExamModel.aggregate([
        {
          $match: {
            studentId: studentId,
            'answers.isCorrect': true,
            'answers.axis_code': axisCode,
          },
        },
        {
          $project: {
            correctAnswersCount: {
              $size: {
                $filter: {
                  input: '$answers',
                  as: 'answer',
                  cond: {
                    $and: [
                      { $eq: ['$$answer.isCorrect', true] },
                      { $eq: ['$$answer.axis_code', axisCode] },
                    ],
                  },
                },
              },
            },
          },
        },
      ]);

      const totalCorrectAnswers =
        correctQuestionsCount.length > 0
          ? correctQuestionsCount[0].correctAnswersCount
          : 0;

      const totalQuestions = exam.questions.length;
      const percentage = (totalCorrectAnswers / totalQuestions) * 100;

      return parseFloat(percentage.toFixed(2));
    } catch (error) {
      console.error('Error in calculatePercentage:', error);
      throw new Error('An error occurred while calculating percentage.');
    }
  }

  private async findStudentLevel(): Promise<any> {
    return "2";
  }

  // Persistir registro student_examResult
  private async saveStudentExamResult(studentExamResult: {
    level: any;
    percentage: number;
  }): Promise<any> {
    return null;
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

      const question: QuestionDto = aggregationResult[0].questions[0];

      if (question == null) {
        throw new EduException('QUESTION_NOT_FOUND');
      }

      const isCorrect = await this.verifyAnswer(
        question,
        answerRequestDto.optionsAnswered,
      );

      const checkAxisRemainingQuestions =
        await this.checkAxisRemainingQuestions(
          question.order + 1,
          question.axis_code,
        );

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
          return await this.getNextAxisQuestion(
            question.order + 1,
            question.axis_code,
            'A',
          );
        } else {
          return await this.getNextQuestionFromAxis(
            question.axis_code,
            studentId,
            examId,
          );
        }
      } else {
        let checkQuestionBSecondAttempt = false;
        if (question.category === 'A') {
          checkQuestionBSecondAttempt = await this.checkAxisRemainingQuestions(
            question.order,
            question.axis_code,
          );
        }
        if (checkQuestionBSecondAttempt) {
          return await this.getNextAxisQuestion(
            question.order,
            question.axis_code,
            'B',
          );
        } else {
          await this.assignWrongAnswersToRemainingAxisQuestions(
            studentId,
            examId,
            question.order,
            question.axis_code,
          );
          return await this.getNextQuestionFromAxis(
            question.axis_code,
            studentId,
            examId,
          );
        }
      }
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
  }

  // Salva a resposta no banco de dados studentexams.answer
  async saveAnswer(
    studentId: string,
    examId: string,
    question: QuestionDto,
    answeredOptions: OptionsAnswers[],
    isCorrect: boolean,
    lastQuestion: boolean,
  ): Promise<boolean> {
    try {
      let studentExam = await this.studentExamModel.findOne({
        studentId,
        examId,
      });

      if (!studentExam) {
        studentExam = new this.studentExamModel({
          studentId,
          examId,
          answers: [],
          isCorrect,
          axis_code: question.axis_code,
          lastQuestion,
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

    return aggregationResult[0].questions[0];
  }

  // Obter a próxima questão do eixo seguinte (se houver questão do eixo finaliza a prova)
  async getNextQuestionFromAxis(
    axisCode: string,
    studentId: string,
    examId: string,
  ): Promise<QuestionDto | AnswersResponseDto> {
    const nextAxisCode = await this.getNextAxisCode(axisCode);

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

      return aggregationResult[0].questions[0];
    } else {
      return await this.finishExam(studentId, examId);
    }
  }

  private async finishExam(
    studentId: string,
    examId: string,
  ): Promise<AnswersResponseDto> {
    try {
      const studentExam = await this.studentExamModel.findOne({
        studentId,
        examId,
      });

      if (studentExam) {
        studentExam.examDate = new Date();
        studentExam.examPerformed = true;
      } else {
        throw new EduException('STUDENT_NOT_FOUND');
      }

      await studentExam.save();

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
  ): Promise<boolean> {
    try {
      const aggregationResult: any[] = await this.examModel
        .aggregate([
          {
            $match: {
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
                      { $eq: ['$$question.axis_code', axisCode] },
                      { $gt: ['$$question.order', order] },
                    ],
                  },
                },
              },
            },
          },
        ])
        .exec();

      if (aggregationResult.length > 0) {
        const filteredOrderValues = aggregationResult[0].questions.map(
          (question: any) => question,
        );

        for (const question of filteredOrderValues) {
          await this.saveAnswer(
            studentId,
            examId,
            question,
            null,
            false,
            false,
          );
        }

        console.log(filteredOrderValues);
      }

      return true;
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
  }

  //Obter o próximo eixo
  private async getNextAxisCode(axisCode: string): Promise<string | null> {
    const axisMappings: { [key: string]: string | null } = {
      ES: 'EA',
      EA: 'LC',
      LC: null,
    };

    return axisMappings[axisCode] || null;
  }

  private async createExamStudant(studentId: string): Promise<boolean> {
    try {
      const exam = await this.studentExamModel.findOne().sort({ field: 'asc' });

      if (!exam) {
        console.error('Nenhum exame encontrado');
        throw new EduException('EXAM_NOT_FOUND');
      }

      const studentExam = new this.studentExamModel({
        studentId: studentId,
        examId: exam.examId,
        examDate: new Date(),
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
}
