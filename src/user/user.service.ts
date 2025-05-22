import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserRequestDto } from "./dto/request/create-user-request.dto";
import { AddUsersDto } from "./dto/add-users.dto";
import {
	AddUsersResponseDto,
	AddUsersResponseErrorDto,
} from "./dto/response/add-users-response.dto";
import { UpdateUserRequestDto } from "./dto/request/update-user-request.dto";
import { EduException } from "../common/exceptions/edu-school.exception";
import { PaginationResponse } from "../common/pagination/pagination-response.dto";
import {
	Prisma,
	Profile,
	SchoolGradeEnum,
	Status,
	User,
	UserSchoolClass,
} from "@prisma/client";
import { UserResponseDto } from "./dto/response/user-response.dto";
import { DeleteUserResponseDto } from "./dto/response/delete-user-response.dto";
import { ValidationUtilsService } from "../common/utils/validation-utils.service";
import { InativeUserResponseDto } from "./dto/response/inative-user-response.dto";
import { InativeUserRequestDto } from "./dto/request/inative-user-request.dto";
import { BcryptService } from "../common/services/bcrypt.service";
import { UserAccessCodeResponseDto } from "./dto/response/user-access-code-response.dto";
import { UserAccessCodeOptionResponseDto } from "./dto/response/user-access-code-option-response.dto";
import { AlgorithmAccessKeyEnum } from "./enums/algorithm-access-key.enum";
import { ObjectAccessKeyEnum } from "./enums/object-access-key.enum";
import { AuthService } from "../auth/auth.service";
import { AuthResponseDto } from "../auth/dto/response/auth-response.dto";
import { DashboardService } from "../dashboard/dashboard.service";
import { EmailService } from "../email/email.service";
import * as xlsx from "xlsx";

@Injectable()
export class UserService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly validationUtilsService: ValidationUtilsService,
		private readonly bcryptService: BcryptService,
		private readonly authService: AuthService,
		private readonly emailService: EmailService,
		private readonly dashboard: DashboardService,
	) {}

	async create(
		createUserDto: CreateUserRequestDto,
		schoolId: string,
		origin: string,
	): Promise<UserResponseDto> {
		const { name, email, profile, password } = createUserDto;
		let { document } = createUserDto;

		if (!name || !email || !document || !profile) {
			throw new EduException("MISSING_REQUIRED_FIELDS");
		}

		if (!this.validationUtilsService.isValidEmail(email)) {
			throw new EduException("INVALID_EMAIL");
		}

		document = document.replace(/-/g, "");
		if (!this.validationUtilsService.isValidDocument(document)) {
			throw new EduException("INVALID_DOCUMENT");
		}

		if (!this.validationUtilsService.isValidProfile(profile)) {
			throw new EduException("INVALID_PROFILE");
		}

		const existingEmail = await this.prismaService.user.findUnique({
			where: { email },
		});
		if (existingEmail) {
			throw new EduException("EMAIL_CONFLICT");
		}

		const existingPersonalDocument = await this.prismaService.user.findUnique({
			where: { document },
		});
		if (existingPersonalDocument) {
			throw new EduException("PERSONAL_DOCUMENT_CONFLICT");
		}

		const hashedPassword = password
			? await this.bcryptService.hashPassword(password)
			: await this.bcryptService.hashPassword(document.substring(0, 6));

		const accessKey = await this.generateUniqueAccessKey();

		const createdUser = await this.prismaService.user.create({
			data: {
				...createUserDto,
				emailConfirmed: false,
				document: document,
				password: hashedPassword,
				profile: profile as Profile,
				status: Status.ACTIVE,
				accessKey: accessKey,
				schoolId,
			},
			select: {
				id: true,
				owner: true,
				status: true,
				name: true,
				email: true,
				accessKey: true,
				emailConfirmed: false,
				document: true,
				profile: true,
			},
		});

		const { token } = await this.authService.generateAuthToken(createdUser.id);

		await this.emailService.confirmEmail({
			email: createdUser.email,
			url: `${origin}/login?token=${token}`,
		});

		return createdUser;
	}

	async parseSpreadsheet(file: Express.Multer.File): Promise<AddUsersDto[]> {
		return new Promise((resolve) => {
			const workbook = xlsx.read(file.buffer, { type: "buffer" });
			const worksheet = workbook.Sheets[workbook.SheetNames[0]];
			const usersData: string[][] = xlsx.utils.sheet_to_json(worksheet, {
				header: 1,
				blankrows: false,
			}) as string[][];

			const headerRow = usersData[0];
			const nameColumnIndex = headerRow.findIndex((column) =>
				/nome|nome completo|nome do usuário/i.test(column),
			);
			const emailColumnIndex = headerRow.findIndex((column) =>
				/email|e-mail/i.test(column),
			);
			const documentColumnIndex = headerRow.findIndex((column) =>
				/cpf/i.test(column),
			);
			const profileColumnIndex = headerRow.findIndex((column) =>
				/perfil/i.test(column),
			);

			const profileMappings = {
				diretor: Profile.DIRECTOR,
				diretora: Profile.DIRECTOR,
				professor: Profile.TEACHER,
				professora: Profile.TEACHER,
			};

			const users: AddUsersDto[] = usersData
				.slice(1)
				.map((row, index) => {
					if (row.length === 0) {
						return null;
					}

					const name = row[nameColumnIndex]?.toString().trim();
					const email = row[emailColumnIndex]?.toString().trim();
					const document = row[documentColumnIndex]
						?.toString()
						.trim()
						.replace(/\D/g, "")
						.padStart(11, "0");
					const normalizedProfile = row[profileColumnIndex]
						?.toString()
						.trim()
						.toLocaleLowerCase();

					let profile: Profile = null;
					if (normalizedProfile in profileMappings) {
						profile = profileMappings[normalizedProfile];
					}

					const userData: CreateUserRequestDto = {
						name,
						password: null,
						email,
						document,
						profile,
					};

					return {
						line: index + 2,
						userData,
					};
				})
				.filter((item) => item);

			resolve(users);
		});
	}

	async addUsers(
		usersData: AddUsersDto[],
		schoolId: string,
		origin: string,
	): Promise<AddUsersResponseDto> {
		let countCreated: number = 0;
		let errors: AddUsersResponseErrorDto[] = [];

		const errorMappings = {
			MISSING_REQUIRED_FIELDS: "Necessário preencher todos os campos.",
			INVALID_EMAIL: "E-mail inválido.",
			INVALID_DOCUMENT: "CPF inválido.",
			INVALID_PROFILE:
				"Perfil inválido, permitido apenas diretor ou professor.",
			EMAIL_CONFLICT: "E-mail já cadastrado.",
			PERSONAL_DOCUMENT_CONFLICT: "CPF já cadastrado.",
		};

		for (const item of usersData) {
			const { line, userData } = item;

			try {
				if (!userData.profile) {
					throw new EduException("INVALID_PROFILE");
				}

				await this.create(userData, schoolId, origin);

				countCreated++;
			} catch (error) {
				errors.push({
					line,
					message:
						errorMappings[(error as any).code] || "Erro ao criar registro.",
				});
			}
		}

		return {
			countCreated,
			errors,
		};
	}

	async findAll(
		pageNumber: number,
		pageSize: number,
		filters: any,
	): Promise<PaginationResponse<UserResponseDto>> {
		if (
			!Number.isInteger(pageNumber) ||
			pageNumber <= 0 ||
			!Number.isInteger(pageSize) ||
			pageSize <= 0
		) {
			throw new EduException("INVALID_PAGINATION_PARAMETERS");
		}

		const { name, email, document, profile, status } = filters || {};

		const where: Prisma.UserWhereInput = {
			name: name ? { contains: name, mode: "insensitive" } : undefined,
			email: email ? { contains: email, mode: "insensitive" } : undefined,
			document: document
				? { contains: document, mode: "insensitive" }
				: undefined,
			profile: profile ? { equals: Profile[profile] } : undefined,
			status: status ? { equals: Status[status] } : undefined,
		};

		try {
			const [totalCount, users] = await Promise.all([
				this.prismaService.user.count({ where }),
				this.prismaService.user.findMany({
					where,
					skip: (pageNumber - 1) * pageSize,
					take: pageSize,
					orderBy: { name: "asc" },
				}),
			]);

			const totalPages = Math.ceil(totalCount / pageSize);

			const pagination = {
				totalItems: totalCount,
				pageSize: pageSize,
				pageNumber: pageNumber,
				totalPages: totalPages,
				previousPage: pageNumber > 1 ? pageNumber - 1 : 0,
				nextPage: pageNumber < totalPages ? pageNumber + 1 : 0,
				lastPage: totalPages,
				hasPreviousPage: pageNumber > 1,
				hasNextPage: pageNumber < totalPages,
			};

			const responseUsers: UserResponseDto[] = users.map((user) => ({
				id: user.id,
				owner: user.owner,
				status: user.status,
				name: user.name,
				email: user.email,
				accessKey: user.accessKey,
				document: user.document,
				profile: user.profile,
			}));

			return new PaginationResponse(responseUsers, pagination);
		} catch (error) {
			throw new EduException("DATABASE_ERROR");
		}
	}

	async findOne(id: string): Promise<UserResponseDto> {
		const user = await this.prismaService.user.findUnique({ where: { id } });

		if (!user) {
			throw new EduException("USER_NOT_FOUND");
		}

		return {
			id: user.id,
			owner: user.owner,
			status: user.status,
			name: user.name,
			accessKey: user.accessKey,
			email: user.email,
			document: user.document,
			profile: user.profile,
		};
	}

	async update(
		id: string,
		updateUserDto: UpdateUserRequestDto,
	): Promise<UserResponseDto> {
		const existingUser = await this.prismaService.user.findUnique({
			where: { id },
		});
		if (!existingUser) {
			throw new EduException("USER_NOT_FOUND");
		}

		if (updateUserDto.email) {
			const existingEmail = await this.prismaService.user.findFirst({
				where: { email: updateUserDto.email, id: { not: id } },
			});
			if (existingEmail) {
				throw new EduException("EMAIL_CONFLICT");
			}
		}

		if (updateUserDto.document) {
			const existingPersonalDocument = await this.prismaService.user.findFirst({
				where: {
					document: updateUserDto.document,
					id: { not: id },
				},
			});
			if (existingPersonalDocument) {
				throw new EduException("PERSONAL_DOCUMENT_CONFLICT");
			}
		}

		const { profile, ...rest } = updateUserDto;
		const data: Prisma.UserUpdateInput = {
			...rest,
			updatedAt: new Date(),
			profile: Profile[profile],
			accessKey: existingUser.accessKey,
			owner: existingUser.owner,
		};

		const updatedUser = await this.prismaService.user.update({
			where: { id },
			data,
		});

		return {
			id: updatedUser.id,
			owner: updatedUser.owner,
			status: updatedUser.status,
			name: updatedUser.name,
			email: updatedUser.email,
			accessKey: updatedUser.accessKey,
			document: updatedUser.document,
			profile: updatedUser.profile,
		};
	}

	async remove(ids: string[]): Promise<DeleteUserResponseDto> {
		if (!ids || ids.length === 0) {
			throw new EduException("IDS_REQUIRED");
		}

		const users = await this.prismaService.user.findMany({
			where: {
				id: {
					in: ids,
				},
			},
			select: {
				id: true,
				owner: true,
			},
		});

		const usersToDelete = users.filter((user) => !user.owner);
		const deleteIds = usersToDelete.map((user) => user.id);

		if (deleteIds.length === 0) {
			throw new EduException("CANNOT_DELETE_OWNER_USERS");
		}

		const schoolClassIds = await this.getSchoolClassIdsByUserIds(ids);
		const schoolYearNames =
			await this.getSchoolYearNamesBySchoolClassIds(schoolClassIds);

		await this.prismaService.userSchoolClass.deleteMany({
			where: {
				userId: {
					in: deleteIds,
				},
			},
		});

		const deleteResult = await this.prismaService.user.deleteMany({
			where: {
				id: {
					in: deleteIds,
				},
			},
		});

		if (deleteResult.count === 0) {
			throw new EduException("USERS_NOT_FOUND");
		}

		this.dashboard.updateDashboardDataArray(schoolYearNames).then();

		return { success: true };
	}

	async deactivateUsers(
		requestDto: InativeUserRequestDto,
	): Promise<InativeUserResponseDto> {
		try {
			const { ids } = requestDto;

			if (!ids || ids.length === 0) {
				throw new EduException("IDS_REQUIRED");
			}

			const users = await this.prismaService.user.findMany({
				where: { id: { in: ids } },
			});

			const existingUserIds = users.map((user) => user.id);

			await this.prismaService.user.updateMany({
				where: { id: { in: existingUserIds }, status: Status.ACTIVE },
				data: { status: Status.INACTIVE },
			});

			const success = existingUserIds.length > 0;

			return { success };
		} catch (error) {
			if (error instanceof EduException) {
				throw error;
			}
			throw new EduException("DATABASE_ERROR");
		}
	}

	private async generateUniqueAccessKey(
		algorithm: AlgorithmAccessKeyEnum = AlgorithmAccessKeyEnum.WITHOUT_OBJECT,
	): Promise<string> {
		if (algorithm === AlgorithmAccessKeyEnum.WITHOUT_OBJECT) {
			return await this.generateUniqueAccessKeyWithoutObject();
		}

		if (algorithm === AlgorithmAccessKeyEnum.WITH_OBJECT) {
			return this.generateUniqueAccessKeyWithObject();
		}

		throw new EduException("UNKNOWN_ACCESS_CODE_ALGORITHM");
	}

	private async generateUniqueAccessKeyWithoutObject(
		digits: number = 4,
	): Promise<string> {
		const allUsers = await this.prismaService.user.findMany({
			select: {
				accessKey: true,
			},
		});

		const usedKeys = new Set(allUsers.map((user) => user.accessKey));
		const notUsedKeys: string[] = Array.from(
			{ length: 10 ** digits - 1 },
			(_, index) => String(index + 1).padStart(digits, "0"),
		).filter((key) => !usedKeys.has(key));

		if (notUsedKeys.length === 0) {
			throw new EduException("LIMIT_EXCEEDED_ACCESS_CODE");
		}

		return notUsedKeys[this.generateRandomNumber(0, notUsedKeys.length - 1)];
	}

	// Podem ser Gerados até 1.000.000 sem repetição
	private generateUniqueAccessKeyWithObject(): string {
		const object = this.getRandomObject();
		const number = this.generateRandomNumber(1, 9999);

		let accessKey = `${object}${this.formatNumber(number, 4)}`;

		while (!this.isAccessKeyTaken(accessKey)) {
			accessKey = `${object}${this.formatNumber(number, 4)}`;
		}

		return accessKey;
	}

	private getRandomObject(): ObjectAccessKeyEnum {
		const objects = Object.values(ObjectAccessKeyEnum);
		const randomIndex = Math.floor(Math.random() * objects.length);
		return objects[randomIndex];
	}

	private generateRandomNumber(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	private formatNumber(number: number, length: number): string {
		let result = number.toString();

		while (result.length < length) {
			result = "0" + result;
		}

		return result;
	}

	private isAccessKeyTaken(accessKey: string): boolean {
		const user = this.prismaService.user.findUnique({ where: { accessKey } });
		return !!user;
	}

	async getAccessCode(id: string): Promise<UserAccessCodeResponseDto> {
		const user = await this.prismaService.user.findUnique({ where: { id } });

		if (!user) {
			throw new EduException("USER_NOT_FOUND");
		}
		return {
			accessKey: user.accessKey,
		};
	}

	async updateAccessCode(id: string): Promise<UserAccessCodeResponseDto> {
		const user = await this.prismaService.user.findUnique({ where: { id } });

		if (!user) {
			throw new EduException("USER_NOT_FOUND");
		}

		const data = {
			accessKey: await this.generateUniqueAccessKey(),
		};

		try {
			await this.prismaService.user.update({
				where: { id: id },
				data,
			});
			return {
				accessKey: data.accessKey,
			};
		} catch (error) {
			throw new EduException("UPDATE_ACCESS_CODE_ERROR");
		}
	}

	async updatePassword(
		user: User,
		oldPassword: string,
		newPassword: string,
	): Promise<AuthResponseDto> {
		const isPasswordValid = await this.bcryptService.comparePasswords(
			oldPassword,
			user.password,
		);

		if (!isPasswordValid) {
			throw new EduException("INVALID_PASSWORD");
		}

		const [isPasswordStrong, message] =
			this.validationUtilsService.isPasswordStrong(newPassword);
		if (!isPasswordStrong) {
			throw new EduException("WEAK_PASSWORD", message);
		}

		const hashedPassword = await this.bcryptService.hashPassword(newPassword);

		await this.prismaService.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		});

		return await this.authService.authenticateUser({
			email: user.email,
			password: newPassword,
		});
	}

	async getFirstUserIdBySchoolClassId(schoolClassId: string): Promise<string> {
		const user = await this.prismaService.userSchoolClass.findFirst({
			where: {
				schoolClassId,
			},
			select: {
				userId: true,
			},
		});

		if (!user) {
			throw new EduException("USER_NOT_FOUND");
		}

		return user.userId;
	}

	async getAccessCodeOptions(
		id: string,
		totalOptions: number = 4,
		digits: number = 4,
	): Promise<UserAccessCodeOptionResponseDto[]> {
		const user = await this.prismaService.user.findUnique({ where: { id } });

		if (!user) {
			throw new EduException("USER_NOT_FOUND");
		}

		const correctAnswerPosition = this.generateRandomNumber(
			0,
			totalOptions - 1,
		);

		const availableKeys = Array.from({ length: 10 ** digits - 1 }, (_, index) =>
			String(index + 1).padStart(digits, "0"),
		).filter((key) => key !== user.accessKey);

		return Array.from({ length: totalOptions }).map((_, position) => {
			if (position == correctAnswerPosition) {
				return {
					accessKey: user.accessKey,
					correctAnswer: true,
				};
			}

			const randomIndex = this.generateRandomNumber(
				0,
				availableKeys.length - 1,
			);
			const accessKey = availableKeys.splice(randomIndex, 1)[0];
			return {
				accessKey,
				correctAnswer: false,
			};
		});
	}

	async userClasses(
		userId: string,
		userProfile: Profile,
	): Promise<
		{
			id: string;
			name: string;
			schoolGrade: SchoolGradeEnum;
		}[]
	> {
		let classesByUser: UserSchoolClass[];

		if (userProfile === Profile.TEACHER) {
			classesByUser = await this.prismaService.userSchoolClass.findMany({
				where: { userId },
			});
		}

		if (userProfile === Profile.DIRECTOR) {
			classesByUser = await this.prismaService.userSchoolClass.findMany();
		}

		const classes = await this.prismaService.schoolClass.findMany({
			where: { id: { in: classesByUser.map((c) => c.schoolClassId) } },
			select: {
				id: true,
				name: true,
				schoolGrade: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		return classes;
	}

	async getSchoolClassIdsByUserIds(userIds: string[]): Promise<string[]> {
		const userSchoolClasses = await this.prismaService.userSchoolClass.findMany(
			{
				where: {
					userId: {
						in: userIds,
					},
				},
				select: {
					schoolClassId: true,
				},
			},
		);

		return userSchoolClasses.map((item) => item.schoolClassId);
	}

	async getSchoolYearNamesBySchoolClassIds(
		schoolClassIds: string[],
	): Promise<number[]> {
		const schoolClasses = await this.prismaService.schoolClass.findMany({
			where: {
				id: {
					in: schoolClassIds,
				},
			},
			select: {
				schoolYearId: true,
			},
		});

		const schoolYearIds = schoolClasses.map((item) => item.schoolYearId);

		const schoolYears = await this.prismaService.schoolYear.findMany({
			where: {
				id: {
					in: schoolYearIds,
				},
			},
			select: {
				name: true,
			},
		});

		return schoolYears.map((item) => item.name);
	}
}
