import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma/prisma.service';
import { SchoolMiddleware } from './middlewares/school.middleware';
import { SchoolYearModule } from './schoolYear/school-year.module';
import { AuthModule } from './auth/auth.module';
import { JwtEduModule } from './auth/jwt-edu.module';

@Module({
  imports: [UserModule, SchoolYearModule, AuthModule, JwtEduModule],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SchoolMiddleware).forRoutes('*');
  }
}
