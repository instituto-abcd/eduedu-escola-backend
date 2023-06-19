import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtEduModule } from './auth/jwt-edu.module';
import { ContentSyncModule } from './content-sync/content-sync.module';
import { SchoolMiddleware } from './middlewares/school.middleware';
import { PrismaService } from './prisma/prisma.service';
import { SchoolClassController } from './school-class/school-class.controller';
import { SchoolClassModule } from './school-class/school-class.module';
import { SchoolClassService } from './school-class/school-class.service';
import { SchoolYearModule } from './schoolYear/school-year.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL, {
      auth: {
        username: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD,
      },
      dbName: 'eduedu-escola',
    }),
    UserModule,
    SchoolYearModule,
    AuthModule,
    JwtEduModule,
    SchoolClassModule,
    ContentSyncModule,
  ],
  providers: [PrismaService, SchoolClassService],
  controllers: [SchoolClassController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SchoolMiddleware)
      .exclude('content-sync/(.*)')
      .forRoutes('*');
  }
}
