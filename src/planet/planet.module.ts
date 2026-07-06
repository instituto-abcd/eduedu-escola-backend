import { Module } from "@nestjs/common";
import { PlanetService } from "./planet.service";
import { PlanetController } from "./planet.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Planet, PlanetSchema } from "../planet-sync/schemas/planet.schema";
import { Exam, ExamSchema } from "../exam/schemas/exam.schema";
import { StudentService } from "../student/student.service";
import {
	StudentExam,
	StudentExamSchema,
} from "../student/schemas/studentExam.schema";
import { PerformanceResultUtilsService } from "../common/utils/performance-result-utils.service";
import { StudentResultService } from "../student/studentResult.service";
import { PrismaService } from "../prisma/prisma.service";
import { ValidationUtilsService } from "../common/utils/validation-utils.service";
import { BcryptService } from "../common/services/bcrypt.service";
import { DashboardService } from "../dashboard/dashboard.service";
import { DateApiService } from "../common/services/date-api.service";
import { StudentExamService } from "../student/studentExam.service";
import { AwardsService } from "../awards/awards.service";
import { StudentAwardService } from "../student/studentAward.service";
import { StudentPlanetExecutionService } from "../student/studentPlanetExecution.service";
import { PlanetSyncModule } from "../planet-sync/planet-sync.module";
import { ExamStorageService } from "../exam/exam-storage.service";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: StudentExam.name, schema: StudentExamSchema },
			{ name: Planet.name, schema: PlanetSchema },
			{ name: Exam.name, schema: ExamSchema },
		]),
		PlanetSyncModule,
	],
	exports: [PerformanceResultUtilsService, StudentResultService],
	controllers: [PlanetController],
	providers: [
		PlanetService,
		StudentService,
		PrismaService,
		ValidationUtilsService,
		BcryptService,
		DashboardService,
		DateApiService,
		StudentExamService,
		AwardsService,
		StudentAwardService,
		StudentResultService,
		StudentPlanetExecutionService,
		PerformanceResultUtilsService,
		ExamStorageService,
	],
})
export class PlanetModule {}
