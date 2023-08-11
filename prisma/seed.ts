import { PrismaClient, Profile } from '@prisma/client';
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

  if (env === 'main') {
    await prismaClient.user.createMany({
      data: [
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Andria Bluschke',
          document: '8917404804',
          email: 'abluschke0@hc360.com',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU001',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Stormie Munson',
          document: '2220389421',
          email: 'smunson1@blinklist.com',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU002',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Ford Leavry',
          document: '7843663711',
          email: 'fleavry2@ameblo.jp',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU003',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Roseline Cornish',
          document: '7449994739',
          email: 'rcornish3@telegraph.co.uk',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU004',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Hamel Horder',
          document: '3140339690',
          email: 'hhorder4@discuz.net',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU005',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Jonah Vice',
          document: '9424612346',
          email: 'jvice5@wufoo.com',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU006',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Normy Benn',
          document: '1199955876',
          email: 'nbenn6@squarespace.com',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU007',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Laney Calcraft',
          document: '6637235598',
          email: 'lcalcraft7@theatlantic.com',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU008',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Cobbie Yuryichev',
          document: '7581428397',
          email: 'cyuryichev8@nationalgeographic.com',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU009',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Miof mela Armfirld',
          document: '2259795951',
          email: 'mmela9@ustream.tv',
          profile: Profile.DIRECTOR,
          schoolId: schoolId,
          accessKey: 'EDUEDU010',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Griswold Dencs',
          document: '6958859316',
          email: 'gdencs0@uol.com.br',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU011',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Christabella Hammond',
          document: '8340577719',
          email: 'chammond1@photobucket.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU012',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Carina Larvor',
          document: '9717350140',
          email: 'clarvor2@icio.us',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU013',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Gayler Mallall',
          document: '9540670519',
          email: 'gmallall3@dot.gov',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU014',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Northrup Manueau',
          document: '1880980703',
          email: 'nmanueau4@prweb.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU015',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Guglielmo Birkby',
          document: '3183903792',
          email: 'gbirkby5@usa.gov',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU016',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Mallory Andri',
          document: '9167455743',
          email: 'mandri6@bloglovin.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU017',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Georgia Freke',
          document: '5918706615',
          email: 'gfreke7@un.org',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU018',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Corette Aneley',
          document: '1800836104',
          email: 'caneley8@accuweather.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU019',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Petrina Martineau',
          document: '4516996006',
          email: 'pmartineau9@mapquest.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU020',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Chancey Matei',
          document: '2460000731',
          email: 'cmateia@bing.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU021',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Yasmin Panton',
          document: '7611027735',
          email: 'ypantonb@hud.gov',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU022',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Kirbie Stockley',
          document: '1470800969',
          email: 'kstockleyc@forbes.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU023',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Elinor Cud',
          document: '1699452660',
          email: 'ecudd@arizona.edu',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU024',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Keene Alan',
          document: '0043684165',
          email: 'kalane@cdbaby.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU025',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Jaynell Dunniom',
          document: '6905764779',
          email: 'jdunniomf@dedecms.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU026',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Nataniel Teasdale-Markie',
          document: '4771982325',
          email: 'nteasdalemarkieg@jugem.jp',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU027',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Kasey Blackaller',
          document: '2675748382',
          email: 'kblackallerh@mashable.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU028',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: 'Randal Walne',
          document: '1907519696',
          email: 'rwalnei@virginia.edu',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU029',
        },
        {
          id: uuidv4(),
          status: 'ACTIVE',
          password:
            '$2b$10$eMCiyozJb3ChrOm55B4lt.3bIpx5GjXEQFtCeWT0166INp/PsdDT6',
          name: "Ossie O'Brien",
          document: '9214318255',
          email: 'oobrienj@lycos.com',
          profile: Profile.TEACHER,
          schoolId: schoolId,
          accessKey: 'EDUEDU030',
        },
      ],
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
