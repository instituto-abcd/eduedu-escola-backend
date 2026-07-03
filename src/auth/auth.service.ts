import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { AuthToken, User } from "@prisma/client";
import { AuthRequestDto } from "./dto/request/auth-request.dto";
import { AuthResponseDto } from "./dto/response/auth-response.dto";
import { EduException } from "../common/exceptions/edu-school.exception";
import { ValidationUtilsService } from "../common/utils/validation-utils.service";
import { BcryptService } from "../common/services/bcrypt.service";
import { EmailService } from "../email/email.service";
import { DateApiService } from "../common/services/date-api.service";
import { ChangePasswordResponseDto } from "./dto/response/change-password-response.dto";
import { ResetPasswordResponseDto } from "./dto/response/reset-password-response.dto";

@Injectable()
export class AuthService {
	private readonly EXPIRES_IN: number = 24 * 3600; // 24 horas em segundos

	constructor(
		private readonly prismaService: PrismaService,
		private readonly jwtService: JwtService,
		private readonly validationUtilsService: ValidationUtilsService,
		private readonly bcryptService: BcryptService,
		private readonly emailService: EmailService,
		private readonly externalApiService: DateApiService,
	) {}

	async authenticateUser(
		authRequestDto: AuthRequestDto,
	): Promise<AuthResponseDto | null> {
		const { email, password } = authRequestDto;
		const user = await this.prismaService.user.findUnique({
			where: { email },
			include: { school: true },
		});

		if (!user) {
			throw new EduException("INVALID_EMAIL_OR_PASSWORD");
		}

		const isPasswordValid = await this.bcryptService.comparePasswords(
			password,
			user.password,
		);

		if (!isPasswordValid) {
			throw new EduException("INVALID_EMAIL_OR_PASSWORD");
		}

		const { accessToken, expiresIn } = await this.generateAccessToken(user);

		// Salvar o token na tabela AuthToken
		const authToken = await this.saveAuthToken(user.id, accessToken, expiresIn);

		const { id, name, email: userEmail, document } = user;
		return new AuthResponseDto(
			id,
			name,
			userEmail,
			document,
			authToken.token,
			authToken.expiresAt.getTime(), // Convertendo para milissegundos
			user.school.name,
		);
	}

	async generateAccessToken(
		user: User,
		expiresIn?: number,
	): Promise<{ accessToken: string; expiresIn: number }> {
		const payload = {
			id: user.id,
			email: user.email,
			profile: user.profile,
			owner: user.owner,
		};

		// Configura o tempo de expiração baseado no parâmetro expiresIn ou usa o padrão EXPIRES_IN
		const tokenExpiresIn = expiresIn || this.EXPIRES_IN;

		const accessToken = this.jwtService.sign(payload, {
			expiresIn: tokenExpiresIn,
		});

		return { accessToken, expiresIn: tokenExpiresIn };
	}

	async saveAuthToken(
		userId: string,
		token: string,
		expiresIn: number,
	): Promise<AuthToken> {
		const currentDateTime = new Date();
		const expiresAt = new Date(currentDateTime.getTime() + expiresIn * 1000);

		const authToken = await this.prismaService.authToken.create({
			data: {
				token,
				expiresAt,
				user: {
					connect: { id: userId },
				},
			},
		});

		return authToken;
	}

	async resetPassword(
		email: string,
		origin: string,
	): Promise<ResetPasswordResponseDto> {
		const user = await this.prismaService.user.findUnique({ where: { email } });
		if (!user) {
			throw new EduException("USER_NOT_FOUND");
		}

		const authToken = await this.generateAuthToken(user.id);
		const url = `${origin}/login?token=${authToken.token}`;

		await this.emailService.resetPassword({ url, name: user.name, email });

		return { token: authToken.token };
	}

	async changePassword(
		token: string,
		password: string,
		passwordConfirmation: string,
	): Promise<ChangePasswordResponseDto> {
		if (password !== passwordConfirmation) {
			throw new EduException("PASSWORDS_DO_NOT_MATCH");
		}

		const currentDateTime = new Date();
		const authToken = await this.prismaService.authToken.findFirst({
			where: {
				token: token,
				expiresAt: { gt: currentDateTime },
			},
		});

		if (!authToken) {
			throw new EduException("INVALID_TOKEN");
		}

		if (currentDateTime > authToken.expiresAt) {
			await this.prismaService.authToken.delete({
				where: { id: authToken.id },
			});
			throw new EduException("TOKEN_EXPIRED");
		}

		const [isPasswordStrong, message] =
			this.validationUtilsService.isPasswordStrong(password);
		if (!isPasswordStrong) {
			throw new EduException("WEAK_PASSWORD", message);
		}

		const hashedPassword = await this.bcryptService.hashPassword(password);

		await this.prismaService.user.update({
			where: { id: authToken.userId },
			data: { password: hashedPassword, emailConfirmed: true },
		});

		await this.prismaService.authToken.delete({
			where: { id: authToken.id },
		});

		return { success: true };
	}

	async generateAuthToken(userId: string): Promise<AuthToken> {
		const currentDateTime = new Date();

		const existingToken = await this.prismaService.authToken.findFirst({
			where: {
				user: { id: userId },
				expiresAt: { gt: currentDateTime },
			},
		});

		if (existingToken) {
			const newExpiresAt = new Date(
				currentDateTime.getTime() + this.EXPIRES_IN * 1000,
			);
			return this.prismaService.authToken.update({
				where: { id: existingToken.id },
				data: { expiresAt: newExpiresAt },
			});
		}

		const { accessToken, expiresIn } = await this.generateAccessToken(
			{ id: userId } as User,
			this.EXPIRES_IN,
		);

		return this.saveAuthToken(userId, accessToken, expiresIn);
	}

	async authenticateAccessKey(accessKey: string): Promise<AuthResponseDto> {
		const user = await this.prismaService.user.findFirst({
			where: { accessKey: { equals: accessKey, mode: "insensitive" } },
			include: { school: true },
		});

		if (!user) {
			throw new EduException("USER_NOT_FOUND");
		}

		if (!user.emailConfirmed) {
			throw new EduException("USER_NOT_CONFIRMED");
		}

		const { accessToken, expiresIn } = await this.generateAccessToken(user);

		// Salvar o token na tabela AuthToken
		const authToken = await this.saveAuthToken(user.id, accessToken, expiresIn);

		return {
			accessToken: authToken.token,
			expiresIn: authToken.expiresAt.getTime(), // Convertendo para milissegundos
			document: user.document,
			email: user.email,
			id: user.id,
			name: user.name,
			schoolName: user.school.name,
		};
	}

	async logout(userId: string): Promise<void> {
		// Remover todos os tokens de autenticação associados ao usuário
		await this.prismaService.authToken.deleteMany({
			where: {
				userId: userId,
			},
		});
	}
}
