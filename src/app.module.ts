import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma/prisma.service';
import { SchoolMiddleware } from './middlewares/school.middleware';
import { SchoolYearModule } from './schoolYear/school-year.module';
import { AuthModule } from './auth/auth.module';
import { JwtEduModule } from './auth/jwt-edu.module';
import { SchoolClassService } from './school-class/school-class.service';
import { SchoolClassController } from './school-class/school-class.controller';
import { SchoolClassModule } from './school-class/school-class.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [
    UserModule,
    SchoolYearModule,
    AuthModule,
    JwtEduModule,
    SchoolClassModule,
    StudentModule,
  ],
  providers: [PrismaService, SchoolClassService],
  controllers: [SchoolClassController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SchoolMiddleware).forRoutes('*');
  }
}
