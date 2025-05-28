export class QuestionDto {
	id: number;
	axis_code: string;
	order: number;
	category: string;
	school_year: number;
	level: number;
	description: string;
	model_id: string;

	orderedAnswer: boolean;
	progress?: number = 0;
	titles: {
		file_name: string;
		file_url: string;
		description: string;
		position: number;
		placeholder: string;
		type: string;
	}[];
	options: {
		sound_name?: string;
		sound_url?: string | null;
		image_name?: string;
		image_url?: string | null;
		description: string;
		isCorrect: boolean;
		position: number;
		id: string;
	}[];
}
