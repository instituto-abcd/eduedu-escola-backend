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
import { SchoolYearSchedulerService } from "./schedules/school-year-schedule.service";
import { SchoolClassScheduleService } from "./schedules/school-class-schedule.service";
import { ExamModule } from './exam/exam.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI, {
      auth: {
        username: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD,
      },
      dbName: 'eduedu-escola-admin',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'dist', 'templates'),
      serveRoot: '/static',
    }),
    UserModule,
    SchoolYearModule,
    AuthModule,
    JwtEduModule,
    SchoolClassModule,
    PlanetSyncModule,
    RabbitMQModule,
    StudentModule,
    SettingsModule,
    DashboardModule,
    NotificationModule,
    AuditModule,
    ExamModule,
  ],
  providers: [
    PrismaService,
    SchoolClassService,
    DashboardService,
    DateApiService,
    SchoolYearSchedulerService,
    SchoolClassScheduleService,
  ],
  controllers: [SchoolClassController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SchoolMiddleware).exclude('planet-sync/(.*)').forRoutes('*');
  }
}
