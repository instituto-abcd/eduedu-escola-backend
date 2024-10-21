import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtEduModule } from './auth/jwt-edu.module';
import { PlanetSyncModule } from './planet-sync/planet-sync.module';
import { SchoolMiddleware } from './middlewares/school.middleware';
import { PrismaService } from './prisma/prisma.service';
import { SchoolClassController } from './school-class/school-class.controller';
import { SchoolClassModule } from './school-class/school-class.module';
import { SchoolYearModule } from './school-year/school-year.module';
import { UserModule } from './user/user.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { StudentModule } from './student/student.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationModule } from './notification/notification.module';
import { DateApiService } from './common/services/date-api.service';
import { SchoolClassService } from './school-class/school-class.service';
import { DashboardService } from './dashboard/dashboard.service'; // Import DateApiService
import { AuditModule } from './audit/audit.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchoolYearSchedulerService } from './schedules/school-year-schedule.service';
import { SchoolClassScheduleService } from './schedules/school-class-schedule.service';
import { AwardsModule } from './awards/awards.module';
import { ExamModule } from './exam/exam.module';
import { StudentExamService } from './student/studentExam.service';
import {
  StudentExam,
  StudentExamSchema,
} from './student/schemas/studentExam.schema';
import { PlanetModule } from './planet/planet.module';
import { SchoolClassResultService } from './school-class/school-class-result.service';
import { ReportModule } from './report/report.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { UtilsModule } from './common/utils/utils.module';
import { LottieModule } from './lottie/lottie.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI, {
      auth: {
        username: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD,
      },
      dbName: process.env.DB_MONGO || 'eduedu-escola-admin',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'dist', 'templates'),
      serveRoot: '/static',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'assets-data'),
      serveRoot: '/assets-data',
    }),
    MongooseModule.forFeature([
      { name: StudentExam.name, schema: StudentExamSchema },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_URL,
        port: 6379,
      },
    }),
    CacheModule.register({ isGlobal: true }),
    UserModule,
    SchoolYearModule,
    AuthModule,
    JwtEduModule,
    SchoolClassModule,
    PlanetSyncModule,
    // RabbitMQModule,
    StudentModule,
    SettingsModule,
    DashboardModule,
    NotificationModule,
    AuditModule,
    AwardsModule,
    ExamModule,
    PlanetModule,
    ReportModule,
    UtilsModule,
    LottieModule,
    BackupModule,
  ],
  providers: [
    PrismaService,
    SchoolClassService,
    DashboardService,
    DateApiService,
    SchoolYearSchedulerService,
    SchoolClassScheduleService,
    StudentExamService,
    SchoolClassResultService,
  ],
  controllers: [SchoolClassController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SchoolMiddleware).exclude('planet-sync/(.*)').forRoutes('*');
  }
}
