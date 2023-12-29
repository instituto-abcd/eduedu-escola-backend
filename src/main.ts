import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SchoolClassScheduleService } from './schedules/school-class-schedule.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('EduEdu Escola')
    .setDescription('EduEdu Escola API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.enableCors();

  const schoolClassService = app.get(SchoolClassScheduleService);
  await schoolClassService.updateSchoolClassStudentsStartApp();

  await app.listen(3000);
}
bootstrap();
