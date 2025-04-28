import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { PrismaService } from "../prisma/prisma.service";
import { BcryptService } from "../common/services/bcrypt.service";

@Module({
	providers: [EmailService, PrismaService, BcryptService],
})
export class EmailModule {}
