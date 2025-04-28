import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SchoolClassController } from "./school-class.controller";
import { SchoolClassService } from "./school-class.service";
import { DashboardService } from "../dashboard/dashboard.service";
import { DateApiService } from "../common/services/date-api.service";
import { ValidationUtilsService } from "../common/utils/validation-utils.service";
import { MongooseModule } from "@nestjs/mongoose";
import {
	StudentExam,
	StudentExamSchema,
} from "../student/schemas/studentExam.schema";
import { StudentExamService } from "../student/studentExam.service";
import { SchoolClassResultService } from "./school-class-result.service";
import { StudentModule } from "../student/student.module";
import { UtilsModule } from "../common/utils/utils.module";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: StudentExam.name, schema: StudentExamSchema },
		]),
		StudentModule,
		UtilsModule,
	],
	controllers: [SchoolClassController],
	providers: [
		SchoolClassService,
		PrismaService,
		DashboardService,
		DateApiService,
		ValidationUtilsService,
		StudentExamService,
		SchoolClassResultService,
	],
})
export class SchoolClassModule {}
