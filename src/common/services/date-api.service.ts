import { Injectable } from "@nestjs/common";

@Injectable()
export class DateApiService {
	getCurrentYear(): number {
		return new Date().getFullYear();
	}

	getCurrentTime() {
		return new Date();
	}
}
