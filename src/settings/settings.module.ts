import { Module } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";
import { PrismaService } from "../prisma/prisma.service";
import { BcryptService } from "../common/services/bcrypt.service";
import { UserService } from "../user/user.service";
import { AuthService } from "../auth/auth.service";
import { DashboardService } from "../dashboard/dashboard.service";
import { ValidationUtilsService } from "../common/utils/validation-utils.service";
import { DateApiService } from "../common/services/date-api.service";
import { EmailService } from "../email/email.service";
import { UtilsModule } from "../common/utils/utils.module";

@Module({
	controllers: [SettingsController],
	providers: [
		SettingsService,
		PrismaService,
		BcryptService,
		UserService,
		AuthService,
		DashboardService,
		DateApiService,
		ValidationUtilsService,
		EmailService,
		ValidationUtilsService,
	],
	imports: [UtilsModule],
})
export class SettingsModule {}
