import { Module } from "@nestjs/common";
import { LottieService } from "./lottie.service";
import { LottieController } from "./lottie.controller";
import { StorageService } from "../planet-sync/storage.service";
import { MongooseModule } from "@nestjs/mongoose";
import {
	DownloadedFile,
	DownloadedFileSchema,
} from "../planet-sync/schemas/download-file.schema";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: DownloadedFile.name, schema: DownloadedFileSchema },
		]),
	],
	controllers: [LottieController],
	providers: [LottieService, StorageService],
})
export class LottieModule {}
