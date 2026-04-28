import {
  PrismaClient,
  StatusSchoolYear,
  SchoolGradeEnum,
  SchoolPeriodEnum,
  Profile,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

const prisma = new PrismaClient();

const COUNT = 20; // legacy count for Notification / UserNotification / Audit
const CURRENT_YEAR = 2026;
const CLASSES_COUNT = 5;
const STUDENTS_PER_CLASS = 20;
const ACTIVITIES_PER_STUDENT = 5;

const FIRST_NAMES_M = [
  'João',
  'Pedro',
  'Lucas',
  'Gabriel',
  'Matheus',
  'Rafael',
  'Bruno',
  'Felipe',
  'Gustavo',
  'Leonardo',
  'Daniel',
  'Thiago',
  'Ricardo',
  'Henrique',
  'Eduardo',
  'Vinícius',
  'Bernardo',
  'Davi',
  'Arthur',
  'Miguel',
  'Heitor',
  'Theo',
  'Enzo',
  'Caio',
  'Lorenzo',
  'Murilo',
  'Otávio',
  'Samuel',
  'Benício',
  'Anthony',
];
const FIRST_NAMES_F = [
  'Maria',
  'Ana',
  'Júlia',
  'Beatriz',
  'Larissa',
  'Camila',
  'Gabriela',
  'Mariana',
  'Letícia',
  'Isabela',
  'Sofia',
  'Helena',
  'Valentina',
  'Laura',
  'Alice',
  'Manuela',
  'Lívia',
  'Cecília',
  'Luiza',
  'Heloísa',
  'Yasmin',
  'Clara',
  'Eloá',
  'Antonella',
  'Lorena',
  'Rafaela',
  'Olivia',
  'Esther',
  'Pietra',
  'Bianca',
];
const SURNAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Rodrigues',
  'Ferreira',
  'Almeida',
  'Pereira',
  'Lima',
  'Gomes',
  'Costa',
  'Ribeiro',
  'Martins',
  'Carvalho',
  'Araújo',
  'Melo',
  'Barbosa',
  'Cardoso',
  'Rocha',
  'Nascimento',
  'Dias',
  'Cavalcanti',
  'Moreira',
  'Mendes',
  'Pinto',
  'Teixeira',
  'Correia',
  'Freitas',
  'Castro',
  'Ramos',
];
const CLASS_NAMES = [
  'Turma do Sol',
  'Turma da Lua',
  'Turma das Estrelas',
  'Turma do Mar',
  'Turma da Floresta',
  'Turma dos Pioneiros',
  'Turma do Saber',
  'Turma da Alegria',
  'Turma da Esperança',
  'Turma da Paz',
];

function pickFullName(seed: number): string {
  const female = seed % 2 === 0;
  const pool = female ? FIRST_NAMES_F : FIRST_NAMES_M;
  const first = pool[seed % pool.length];
  const middle = SURNAMES[(seed * 3 + 1) % SURNAMES.length];
  const last = SURNAMES[(seed * 7 + 11) % SURNAMES.length];
  return middle === last ? `${first} ${last}` : `${first} ${middle} ${last}`;
}

async function createSchoolYears(schoolId: string): Promise<string[]> {
  const id = uuidv4();
  await prisma.schoolYear.create({
    data: {
      id,
      name: CURRENT_YEAR,
      schoolId,
      status: StatusSchoolYear.ACTIVE,
    },
  });
  console.log(`SchoolYear: inserted 1`);
  return [id];
}

const GRADES: SchoolGradeEnum[] = [
  SchoolGradeEnum.CHILDREN,
  SchoolGradeEnum.FIRST_GRADE,
  SchoolGradeEnum.SECOND_GRADE,
  SchoolGradeEnum.THIRD_GRADE,
];
const PERIODS: SchoolPeriodEnum[] = [
  SchoolPeriodEnum.MORNING,
  SchoolPeriodEnum.AFTERNOON,
  SchoolPeriodEnum.FULL,
];

type SchoolClassInfo = {
  id: string;
  name: string;
  schoolGrade: SchoolGradeEnum;
};

async function createSchoolClasses(
  schoolId: string,
  schoolYearIds: string[],
): Promise<SchoolClassInfo[]> {
  const classes: SchoolClassInfo[] = [];
  const yearId = schoolYearIds[0];
  for (let i = 0; i < CLASSES_COUNT; i++) {
    const id = uuidv4();
    const schoolGrade = GRADES[i % GRADES.length];
    const name = CLASS_NAMES[i % CLASS_NAMES.length];
    await prisma.schoolClass.create({
      data: {
        id,
        name,
        schoolGrade,
        schoolPeriod: PERIODS[i % PERIODS.length],
        schoolYearId: yearId,
        schoolId,
      },
    });
    classes.push({ id, name, schoolGrade });
  }
  console.log(`SchoolClass: inserted ${classes.length}`);
  return classes;
}

// Matches seed.ts: bcrypt hash of the shared dev password.
const DEFAULT_TEACHER_PASSWORD_HASH =
  '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6';

async function createTeachers(schoolId: string): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < CLASSES_COUNT; i++) {
    const id = uuidv4();
    const suffix = String(i + 1).padStart(3, '0');
    await prisma.user.create({
      data: {
        id,
        status: 'ACTIVE',
        password: DEFAULT_TEACHER_PASSWORD_HASH,
        name: pickFullName(i + 1000),
        document: `9000${suffix}0000`.slice(0, 11),
        email: `professor${suffix}@email.com`,
        emailConfirmed: true,
        profile: Profile.TEACHER,
        schoolId,
        accessKey: `EDUEDU-T${suffix}`,
      },
    });
    ids.push(id);
  }
  console.log(`User (TEACHER): inserted ${ids.length}`);
  return ids;
}

async function createUserSchoolClasses(
  teacherIds: string[],
  schoolClassIds: string[],
): Promise<void> {
  // Composite PK (userId, schoolClassId). Pair each teacher with one class.
  for (let i = 0; i < schoolClassIds.length; i++) {
    await prisma.userSchoolClass.create({
      data: {
        userId: teacherIds[i % teacherIds.length],
        schoolClassId: schoolClassIds[i],
      },
    });
  }
  console.log(`UserSchoolClass: inserted ${schoolClassIds.length}`);
}

async function createStudents(): Promise<string[]> {
  const ids: string[] = [];
  const total = CLASSES_COUNT * STUDENTS_PER_CLASS;
  for (let i = 0; i < total; i++) {
    const id = uuidv4();
    await prisma.student.create({
      data: {
        id,
        name: pickFullName(i),
        registry: String(1000 + i).padStart(4, '0'),
        status: 'ACTIVE',
      },
    });
    ids.push(id);
  }
  console.log(`Student: inserted ${ids.length}`);
  return ids;
}

async function createSchoolClassStudents(
  studentIds: string[],
  schoolClassIds: string[],
): Promise<void> {
  // STUDENTS_PER_CLASS students per class, in order. Every student gets exactly one class.
  let count = 0;
  for (let c = 0; c < schoolClassIds.length; c++) {
    for (let s = 0; s < STUDENTS_PER_CLASS; s++) {
      const idx = c * STUDENTS_PER_CLASS + s;
      if (idx >= studentIds.length) break;
      await prisma.schoolClassStudent.create({
        data: {
          studentId: studentIds[idx],
          schoolClassId: schoolClassIds[c],
          active: true,
          reserved: false,
          firstAccess: true,
        },
      });
      count++;
    }
  }
  console.log(`SchoolClassStudent: inserted ${count}`);
}

async function createStudentAwards(studentIds: string[]): Promise<void> {
  // Composite PK (awardId, studentId). One award per student, cycling the
  // existing seed-populated Award catalogue.
  const awards = await prisma.award.findMany();
  if (awards.length === 0) {
    throw new Error('No Awards in DB. Run the seed first.');
  }
  for (let i = 0; i < studentIds.length; i++) {
    await prisma.studentAward.create({
      data: {
        studentId: studentIds[i],
        awardId: awards[i % awards.length].id,
      },
    });
  }
  console.log(`StudentAward: inserted ${studentIds.length}`);
}

const AXIS_CODES = ['ES', 'EA', 'LC'];
const LEVELS = ['Muito abaixo', 'Abaixo', 'Esperado'];

async function createStudentExamResults(
  studentIds: string[],
  currentExamIdByStudent: Map<string, string>,
): Promise<void> {
  // ACTIVITIES_PER_STUDENT rows per student. The first three share the
  // student's current exam id (one per axis) so the class detailed-summary
  // join `studentExamResult.studentExamId == studentExam.id` resolves; the
  // remaining rows simulate prior exam activity.
  let count = 0;
  for (let s = 0; s < studentIds.length; s++) {
    const studentId = studentIds[s];
    const currentExamId = currentExamIdByStudent.get(studentId)!;
    for (let i = 0; i < ACTIVITIES_PER_STUDENT; i++) {
      const axis = AXIS_CODES[i % AXIS_CODES.length];
      const isCurrent = i < AXIS_CODES.length;
      await prisma.studentExamResult.create({
        data: {
          studentExamId: isCurrent ? currentExamId : uuidv4(),
          axisCode: axis,
          percent: 40 + ((s * 7 + i * 11) % 60),
          level: LEVELS[(s + i) % LEVELS.length],
          resume: `Resultado ${axis} ${i + 1}`,
          studentId,
          examDate: new Date(Date.now() - i * 30 * 86_400_000),
        },
      });
      count++;
    }
  }
  console.log(`StudentExamResult: inserted ${count}`);
}

async function createStudentPlanetResults(
  studentIds: string[],
  currentExamIdByStudent: Map<string, string>,
): Promise<void> {
  // ACTIVITIES_PER_STUDENT rows per student, cycling axes. studentExamId
  // matches the student's current Mongo StudentExam so every planet is
  // attributable to the tracked exam attempt.
  let count = 0;
  for (let s = 0; s < studentIds.length; s++) {
    const studentId = studentIds[s];
    const currentExamId = currentExamIdByStudent.get(studentId)!;
    for (let i = 0; i < ACTIVITIES_PER_STUDENT; i++) {
      const axis = AXIS_CODES[i % AXIS_CODES.length];
      await prisma.studentPlanetResult.create({
        data: {
          studentExamId: currentExamId,
          planetId: `planet-${axis}-${i}`,
          planetName: `Planeta ${axis} ${i + 1}`,
          axisCode: axis,
          stars: ((s + i) % 5) + 1,
          studentId,
          lastExecution: new Date(Date.now() - i * 7 * 86_400_000),
        },
      });
      count++;
    }
  }
  console.log(`StudentPlanetResult: inserted ${count}`);
}

async function createDashboards(totals: {
  teachers: number;
  classes: number;
  students: number;
}): Promise<string[]> {
  const id = uuidv4();
  await prisma.dashboard.create({
    data: {
      id,
      schoolYear: CURRENT_YEAR,
      teachersCounter: totals.teachers,
      schoolClassesCounter: totals.classes,
      studentsCounter: totals.students,
    },
  });
  console.log(`Dashboard: inserted 1`);
  return [id];
}

async function createDashboardSchoolGrades(
  dashboardIds: string[],
  classes: SchoolClassInfo[],
): Promise<Map<SchoolGradeEnum, string>> {
  const dashboardId = dashboardIds[0];
  const grouped = new Map<
    SchoolGradeEnum,
    { classCount: number; studentCount: number }
  >();
  for (const cls of classes) {
    const entry = grouped.get(cls.schoolGrade) ?? {
      classCount: 0,
      studentCount: 0,
    };
    entry.classCount += 1;
    entry.studentCount += STUDENTS_PER_CLASS;
    grouped.set(cls.schoolGrade, entry);
  }
  const gradeIdByName = new Map<SchoolGradeEnum, string>();
  for (const [gradeName, totals] of grouped) {
    const id = uuidv4();
    await prisma.dashboardSchoolGrade.create({
      data: {
        id,
        name: gradeName,
        teachersCounter: totals.classCount,
        schoolClassesCounter: totals.classCount,
        studentsCounter: totals.studentCount,
        dashboardId,
      },
    });
    gradeIdByName.set(gradeName, id);
  }
  console.log(`DashboardSchoolGrade: inserted ${gradeIdByName.size}`);
  return gradeIdByName;
}

async function createDashboardSchoolClasses(
  classes: SchoolClassInfo[],
  gradeIdByName: Map<SchoolGradeEnum, string>,
): Promise<string[]> {
  const ids: string[] = [];
  for (const cls of classes) {
    const dashboardGradeId = gradeIdByName.get(cls.schoolGrade)!;
    // DashboardSchoolClass.id must equal SchoolClass.id so the teacher-scoped
    // dashboard query (`classIds` from UserSchoolClass) resolves.
    await prisma.dashboardSchoolClass.create({
      data: {
        id: cls.id,
        name: cls.name,
        studentsCounter: STUDENTS_PER_CLASS,
        dashboardGradeId,
      },
    });
    ids.push(cls.id);
  }
  console.log(`DashboardSchoolClass: inserted ${ids.length}`);
  return ids;
}

async function createDashboardPerformances(
  dashboardClassIds: string[],
): Promise<void> {
  // Dashboard view (dashboard.service.ts) only honors type === 'EXAM' | 'PLANET'.
  // Emit one EXAM row and one PLANET row per (class × axis) so both sections
  // render non-empty data on every turma card.
  let count = 0;
  for (let c = 0; c < dashboardClassIds.length; c++) {
    const classId = dashboardClassIds[c];
    for (let a = 0; a < AXIS_CODES.length; a++) {
      const axis = AXIS_CODES[a];
      await prisma.dashboardPerformance.create({
        data: {
          axis,
          type: 'EXAM',
          result: 55 + ((c * 7 + a * 11) % 40),
          level: String(((c + a) % 3) + 1),
          dashboardSchoolClassId: classId,
        },
      });
      await prisma.dashboardPerformance.create({
        data: {
          axis,
          type: 'PLANET',
          result: 2 + ((c + a) % 4),
          level: String(((c + a) % 3) + 1),
          dashboardSchoolClassId: classId,
        },
      });
      count += 2;
    }
  }
  console.log(`DashboardPerformance: inserted ${count}`);
}

async function createNotifications(): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < COUNT; i++) {
    const id = uuidv4();
    await prisma.notification.create({
      data: {
        id,
        text: `Notificação sintética ${i + 1}`,
        profiles:
          i % 3 === 0
            ? [Profile.DIRECTOR]
            : i % 3 === 1
            ? [Profile.TEACHER]
            : [Profile.DIRECTOR, Profile.TEACHER],
      },
    });
    ids.push(id);
  }
  console.log(`Notification: inserted ${ids.length}`);
  return ids;
}

async function createUserNotifications(
  userId: string,
  notificationIds: string[],
): Promise<void> {
  for (const notificationId of notificationIds) {
    await prisma.userNotification.create({
      data: {
        id: uuidv4(),
        userId,
        notificationId,
        read: false,
      },
    });
  }
  console.log(`UserNotification: inserted ${notificationIds.length}`);
}

const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];
const AUDIT_ENTITIES = ['Student', 'SchoolClass', 'SchoolYear', 'Exam'];

async function createAudits(userId: string): Promise<void> {
  for (let i = 0; i < COUNT; i++) {
    await prisma.audit.create({
      data: {
        id: uuidv4(),
        action: AUDIT_ACTIONS[i % AUDIT_ACTIONS.length],
        entity: AUDIT_ENTITIES[i % AUDIT_ENTITIES.length],
        userId,
      },
    });
  }
  console.log(`Audit: inserted ${COUNT}`);
}

const EXAMS_PER_STUDENT = 2;
const PLANETS_DONE_PER_EXAM = 2;

async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGO_URI;
  const user = process.env.MONGO_USER;
  const password = process.env.MONGO_PASSWORD;
  const dbName = process.env.DB_MONGO;
  if (!uri || !dbName) {
    throw new Error('MONGO_URI and DB_MONGO must be set in the environment.');
  }
  return mongoose.connect(uri, {
    auth: user && password ? { username: user, password } : undefined,
    dbName,
  });
}

function buildExamQuestion(examId: string, axisCode: string, position: number) {
  const questionId = position + 1;
  return {
    orderedAnswer: false,
    level: ((position % 3) + 1) as number,
    axis_code: axisCode,
    id: questionId,
    model_id: `model-${axisCode}-${position}`,
    category: 'synthetic',
    description: `Pergunta sintética ${position + 1} do eixo ${axisCode}`,
    school_year: 2024,
    order: position,
    options: [0, 1, 2, 3].map((optPos) => ({
      description: `Opção ${optPos + 1}`,
      position: optPos,
      isCorrect: optPos === 0,
      id: `${examId}-q${questionId}-o${optPos}`,
    })),
    titles: [
      {
        file_url: '',
        file_name: '',
        description: `Enunciado sintético ${position + 1}`,
        position: 0,
        placeholder: '',
        type: 'text',
      },
    ],
  };
}

async function createExams() {
  const db = mongoose.connection.db;
  const exams = AXIS_CODES.map((axisCode, idx) => {
    const id = uuidv4();
    return {
      id,
      domain_code: 'PORTUGUESE',
      status: 'ACTIVE',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: Array.from({ length: 4 }, (_, qi) =>
        buildExamQuestion(id, axisCode, qi),
      ),
      __axisCode: axisCode,
      __idx: idx,
    };
  });
  await db
    .collection('exams')
    .insertMany(exams.map(({ __axisCode, __idx, ...rest }) => rest));
  console.log(`Exam (Mongo): inserted ${exams.length}`);
  return exams.map(({ __axisCode, __idx, ...rest }) => rest);
}

async function createPlanetsMongo() {
  const db = mongoose.connection.db;
  const planets = Array.from({ length: 6 }, (_, i) => ({
    avatar_id: `avatar-${i + 1}`,
    avatar_url: `http://localhost:3000/assets-data/avatar-${i + 1}.png`,
    axis_code: AXIS_CODES[i % AXIS_CODES.length],
    domain_code: 'PORTUGUESE',
    enable: true,
    id: uuidv4(),
    level: String((i % 3) + 1),
    next_planet_id: null,
    position: i,
    status: 'ACTIVE',
    title: `Planeta Sintético ${i + 1}`,
    updated_at: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    questions: [],
  }));
  await db.collection('planets').insertMany(planets);
  console.log(`Planet (Mongo): inserted ${planets.length}`);
  return planets;
}

async function createStudentExams(
  studentIds: string[],
  exams: Awaited<ReturnType<typeof createExams>>,
  planets: Awaited<ReturnType<typeof createPlanetsMongo>>,
  currentExamIdByStudent: Map<string, string>,
): Promise<void> {
  const db = mongoose.connection.db;
  const docs: any[] = [];
  for (let s = 0; s < studentIds.length; s++) {
    const studentId = studentIds[s];
    for (let e = 0; e < EXAMS_PER_STUDENT; e++) {
      const exam = exams[(s + e) % exams.length];
      const isLast = e === EXAMS_PER_STUDENT - 1;
      const answers = exam.questions.map((q, qi) => ({
        questionId: q.id,
        optionsAnswered: [
          { position: 0, positionAnswer: qi % q.options.length },
        ],
        isCorrect: qi % q.options.length === 0,
        axis_code: q.axis_code,
        level: q.level,
        order: q.order,
        category: q.category,
        school_year: q.school_year,
        lastQuestion: qi === exam.questions.length - 1,
        autoAssignedAnswer: false,
      }));
      // planetTrack spans every axis so the class planet-performance view has
      // "offered" planets across ES/EA/LC.
      const planetTrack = planets.map((planet, pi) => ({
        planetId: planet.id,
        planetName: planet.title,
        planetAvatar: planet.avatar_url,
        axis_code: planet.axis_code,
        order: pi,
        level: planet.level,
        position: planet.position,
        availableAt: new Date(),
        answers: [0, 1, 2].map((qi) => ({
          questionId: `${planet.id}-q${qi}`,
          optionsAnswered: [
            {
              position: 0,
              positionAnswer: qi % 4,
              description: `Opção ${(qi % 4) + 1}`,
              isCorrect: qi % 4 === 0,
            },
          ],
          isCorrect: qi % 4 === 0,
          axis_code: planet.axis_code,
          level: Number(planet.level),
          order: qi,
          lastQuestion: qi === 2,
        })),
      }));
      const _id = isLast ? currentExamIdByStudent.get(studentId)! : uuidv4();
      docs.push({
        _id,
        studentId,
        examId: exam.id,
        examDate: new Date(Date.now() - (EXAMS_PER_STUDENT - e) * 86_400_000),
        current: isLast,
        examPerformed: true,
        lastExam: isLast,
        answers,
        planetTrack,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  await db.collection('studentexams').insertMany(docs);
  console.log(`StudentExam (Mongo): inserted ${docs.length}`);
}

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) {
    throw new Error(
      'No master School found. Run `npm run migrations` and the seed first.',
    );
  }

  const director = await prisma.user.findFirst({
    where: { profile: 'DIRECTOR' },
  });
  if (!director) {
    throw new Error('Master DIRECTOR user must exist. Run the seed first.');
  }

  console.log(`Using school=${school.id} director=${director.id}`);
  console.log(`Target: ${COUNT} rows per non-master table.`);

  const schoolYearIds = await createSchoolYears(school.id);
  const classes = await createSchoolClasses(school.id, schoolYearIds);
  const schoolClassIds = classes.map((c) => c.id);
  const teacherIds = await createTeachers(school.id);
  await createUserSchoolClasses(teacherIds, schoolClassIds);
  const studentIds = await createStudents();
  const currentExamIdByStudent = new Map<string, string>(
    studentIds.map((id) => [id, uuidv4()]),
  );
  await createSchoolClassStudents(studentIds, schoolClassIds);
  await createStudentAwards(studentIds);
  await createStudentExamResults(studentIds, currentExamIdByStudent);
  await createStudentPlanetResults(studentIds, currentExamIdByStudent);
  const dashboardIds = await createDashboards({
    teachers: teacherIds.length,
    classes: classes.length,
    students: studentIds.length,
  });
  const gradeIdByName = await createDashboardSchoolGrades(
    dashboardIds,
    classes,
  );
  const dashboardClassIds = await createDashboardSchoolClasses(
    classes,
    gradeIdByName,
  );
  await createDashboardPerformances(dashboardClassIds);
  const notificationIds = await createNotifications();
  await createUserNotifications(director.id, notificationIds);
  await createAudits(director.id);

  await connectMongo();
  try {
    const exams = await createExams();
    const planets = await createPlanetsMongo();
    await createStudentExams(
      studentIds,
      exams,
      planets,
      currentExamIdByStudent,
    );
  } finally {
    await mongoose.disconnect();
  }

  console.log('Populate complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
