import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma/prisma.service';
import { SchoolMiddleware } from './middlewares/school.middleware';
import { SchoolYearModule } from './schoolYear/school-year.module';

@Module({
  imports: [UserModule, SchoolYearModule],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SchoolMiddleware).forRoutes('*');
  }
}
