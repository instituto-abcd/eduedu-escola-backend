import { PrismaClient, Profile, StatusSchoolYear } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prismaClient = new PrismaClient();
const env = process.env.APP_VERSION;

async function main() {
  const schoolId = uuidv4();

  await prismaClient.school.create({
    data: {
      id: schoolId,
      name: 'EduEdu Escola',
    },
  });

  await prismaClient.settings.create({
    data: {
      id: uuidv4(),
      synchronizationPlanets: true,
      smtpHostName: '',
      smtpUserName: '',
      smtpPassword: '',
      smtpPort: 465,
      sslIsActive: false,
      schoolId: schoolId,
    },
  });

  var awardOneId = uuidv4();  
  var awardTwoId = uuidv4();  
  var awardThreeId = uuidv4();  
  var awardFourId = uuidv4();  
  await prismaClient.award.createMany({
    data: [
      { id: awardOneId, name: 'motivado', title: 'Motivado', description: 'Completou 2 avaliações' },
      { id: awardTwoId, name: 'maestro', title: 'Maestro', description: 'Atingiu nível esperado em consciência fonológica' },
      { id: awardThreeId, name: 'leitor', title: 'Leitor', description: 'Atingiu nível esperado em leitura e compreensão de texto' },
      { id: awardFourId, name: 'escritor', title: 'Escritor', description: 'Atingiu nível esperado em sistema de escrita alfabética' },
      { id: uuidv4(), name: 'confiante', title: 'Confiante', description: 'Acessou a área socioemocional 2 vezes' },
      { id: uuidv4(), name: 'corajoso', title: 'Corajoso', description: 'Acessou a área socioemocional 5 vezes' },
      { id: uuidv4(), name: 'sensivel', title: 'Sensível', description: 'Acessou a área socioemocional 10 vezes' },
      { id: uuidv4(), name: 'fantastico', title: 'Fantástico', description: 'Completou 1 planeta' },
      { id: uuidv4(), name: 'lutador', title: 'Lutador', description: 'Completou 5 planetas' },
      { id: uuidv4(), name: 'super', title: 'Super', description: 'Completou 10 planetas' },
      { id: uuidv4(), name: 'incrivel', title: 'Incrível', description: 'Completou 15 planetas' },
      { id: uuidv4(), name: 'excelente', title: 'Excelente', description: 'Completou 20 planetas' },
      { id: uuidv4(), name: 'brilhante', title: 'Brilhante', description: 'Completou 25 planetas' },
      { id: uuidv4(), name: 'gigante', title: 'Gigante', description: 'Completou 30 planetas' },
      { id: uuidv4(), name: 'competente', title: 'Competente', description: 'Completou 30 planetas' },
      { id: uuidv4(), name: 'bombastico', title: 'Bombástico', description: 'Completou 40 planetas' },
      { id: uuidv4(), name: 'sensacional', title: 'Sensacional', description: 'Completou 45 planetas' },
      { id: uuidv4(), name: 'perfeito', title: 'Perfeito', description: 'Completou 50 planetas' },
    ]
  });

  if (env === 'development') {

    var directorId = uuidv4();
    var teacherId = uuidv4();

    var schollYearId = uuidv4();

    // Ano Escolar
    await prismaClient.schoolYear.create({
      data: {
        id: schollYearId,
        name: new Date().getFullYear(),
        schoolId: schoolId,
        status: StatusSchoolYear.ACTIVE,
      }
    })

    await prismaClient.user.createMany({
      data: [
        {
          id: directorId,
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Diretor da Escola',
          document: '8917404804',
          email: 'diretor@email.com',
          emailConfirmed: true,
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU001',
          owner: true,
        },
        {
          id: teacherId,
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Professor',
          document: '1470800969',
          email: 'professor@email.com',
          emailConfirmed: true,
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU002',
        }
      ],
    });

    // Turma
    var schoolClassId = uuidv4();
    await prismaClient.schoolClass.create({
      data: {
        id: schoolClassId,
        schoolYearId: schollYearId,
        name: 'Turma do Barulho',
        schoolGrade: 'CHILDREN',
        schoolPeriod: 'FULL'
      }
    });
    // Vínculo Turma e Professor
    await prismaClient.userSchoolClass.create({
      data: {
        schoolClassId: schoolClassId,
        userId: teacherId
      }
    });

    // Aluno
    var studentId = uuidv4();
    await prismaClient.student.create({
      data: {
        id: studentId,
        name: 'Dênis o Pimentinha',
        status: 'ACTIVE',
        registry: '0001'
      }
    });
    // Vínculo Turma e Aluno
    await prismaClient.schoolClassStudent.create({
      data: {
        studentId: studentId,
        schoolClassId: schoolClassId
      }
    });
    // Vínculo Aluno e Conquista
    await prismaClient.studentAward.createMany({
      data: [
        { awardId: awardOneId, studentId: studentId },
        { awardId: awardTwoId, studentId: studentId },
        { awardId: awardThreeId, studentId: studentId },
        { awardId: awardFourId, studentId: studentId },
      ]
    })

    var dashboardId = uuidv4();
    await prismaClient.dashboard.create({
      data: {
        id: dashboardId,
        schoolYear: new Date().getFullYear(),
        schoolClassesCounter: 1,
        studentsCounter: 1,
        teachersCounter: 1,
      }
    });
    var dashboardSchoolGradeId = uuidv4();
    await prismaClient.dashboardSchoolGrade.create({
      data: {
        id: dashboardSchoolGradeId,
        name: 'CHILDREN',
        schoolClassesCounter: 1,
        studentsCounter: 1,
        teachersCounter: 1,
        dashboardId: dashboardId
      }
    });
    await prismaClient.dashboardSchoolClass.create({
      data: {
        name: 'Infantil',
        studentsCounter: 1,
        dashboardGradeId: dashboardSchoolGradeId,
      }
    });

  }
}

main()
  .then(async () => {
    await prismaClient.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prismaClient.$disconnect();
    process.exit(1);
  });
