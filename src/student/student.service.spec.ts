import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { AwardsService } from '../awards/awards.service';
import { StudentAwardService } from './studentAward.service';
import { StudentExamService } from './studentExam.service';
import { StudentPlanetExecutionService } from './studentPlanetExecution.service';
import { StorageService } from '../planet-sync/storage.service';
import { ExamStorageService } from '../exam/exam-storage.service';
import { Exam } from '../exam/schemas/exam.schema';
import { StudentExam, Planet } from './schemas/studentExam.schema';
import { EduException } from '../common/exceptions/edu-school.exception';

function makeStudentExam(studentId: string): any {
  const future = new Date();
  future.setDate(future.getDate() + 10);

  return {
    studentId,
    planetTrack: [
      { order: 1, availableAt: new Date('2000-01-01') },
      { order: 2, availableAt: new Date(future) },
      { order: 3, availableAt: new Date(future) },
      { order: 4, availableAt: new Date(future) },
    ],
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('StudentService - releasePlanetsBulk', () => {
  let service: StudentService;
  const studentExamModel = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: PrismaService, useValue: {} },
        { provide: DashboardService, useValue: {} },
        { provide: AwardsService, useValue: {} },
        { provide: StudentAwardService, useValue: {} },
        { provide: StudentExamService, useValue: {} },
        { provide: StudentPlanetExecutionService, useValue: {} },
        { provide: getModelToken(Exam.name), useValue: {} },
        {
          provide: getModelToken(StudentExam.name),
          useValue: studentExamModel,
        },
        { provide: getModelToken(Planet.name), useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: ExamStorageService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(StudentService);
  });

  it('libera planetas para todos os alunos informados', async () => {
    const examA = makeStudentExam('aluno-a');
    const examB = makeStudentExam('aluno-b');
    studentExamModel.find.mockResolvedValue([examA, examB]);

    const result = await service.releasePlanetsBulk({
      ids: ['aluno-a', 'aluno-b'],
    });

    expect(result).toEqual({ success: true });
    expect(studentExamModel.find).toHaveBeenCalledWith({
      studentId: { $in: ['aluno-a', 'aluno-b'] },
      lastExam: true,
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const exam of [examA, examB]) {
      expect(exam.save).toHaveBeenCalledTimes(1);
      // 2 planetas liberados hoje, o seguinte amanhã
      expect(exam.planetTrack[1].availableAt).toEqual(today);
      expect(exam.planetTrack[2].availableAt).toEqual(today);
      expect(exam.planetTrack[3].availableAt).toEqual(tomorrow);
      // planeta já disponível permanece intacto
      expect(exam.planetTrack[0].availableAt).toEqual(new Date('2000-01-01'));
    }
  });

  it('lança IDS_REQUIRED quando ids está vazio', async () => {
    await expect(service.releasePlanetsBulk({ ids: [] })).rejects.toThrow(
      EduException,
    );
    expect(studentExamModel.find).not.toHaveBeenCalled();
  });

  it('lança EXAM_NOT_FOUND e não salva nada quando algum aluno não tem prova', async () => {
    const examA = makeStudentExam('aluno-a');
    studentExamModel.find.mockResolvedValue([examA]);

    await expect(
      service.releasePlanetsBulk({ ids: ['aluno-a', 'aluno-b'] }),
    ).rejects.toThrow('Prova não encontrada.');

    expect(examA.save).not.toHaveBeenCalled();
  });
});
