import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthToken, User } from '@prisma/client';
import { AuthRequestDto } from './dto/request/auth-request.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import { ChangePasswordResponseDto } from './dto/response/change-password-response.dto';
import { ResetPasswordResponseDto } from './dto/response/reset-password-response.dto';
import { DateApiService } from '../common/services/date-api.service';
import { BcryptService } from '../common/services/bcrypt.service';
import { EmailService } from 'src/email/email.service';
import { ValidationUtilsService } from 'src/common/utils/validation-utils.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly validationUtilsService: ValidationUtilsService,
    private readonly externalApiService: DateApiService,
    private readonly bcryptService: BcryptService,
    private readonly emailService: EmailService,
  ) {}

  async authenticateUser(
    authRequestDto: AuthRequestDto,
  ): Promise<AuthResponseDto | null> {
    const { email, password } = authRequestDto;
    const user = await this.prismaService.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new EduException('INVALID_EMAIL_OR_PASSWORD');
    }

    const isPasswordValid = await this.bcryptService.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new EduException('INVALID_EMAIL_OR_PASSWORD');
    }

    const accessToken = this.generateAccessToken(user);
    const { id, name, email: userEmail, document } = user;
    return new AuthResponseDto(id, name, userEmail, document, accessToken);
  }

  generateAccessToken(user: User): string {
    const payload = {
      email: user.email,
      profile: user.profile,
      owner: user.owner,
    };
    return this.jwtService.sign(payload);
  }

  async resetPassword(
    email: string,
    origin: string,
  ): Promise<ResetPasswordResponseDto> {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new EduException('USER_NOT_FOUND');
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
      throw new EduException('PASSWORDS_DO_NOT_MATCH');
    }

    const currentDateTime = await this.externalApiService.getCurrentTime();
    const authToken = await this.prismaService.authToken.findFirst({
      where: {
        token: token,
        expiresAt: { gt: currentDateTime },
      },
    });

    if (!authToken) {
      throw new EduException('INVALID_TOKEN');
    }

    if (currentDateTime > authToken.expiresAt) {
      await this.prismaService.authToken.delete({
        where: { id: authToken.id },
      });
      throw new EduException('TOKEN_EXPIRED');
    }

    const [isPasswordStrong, message] = this.validationUtilsService.isPasswordStrong(password);
    if (!isPasswordStrong) {
      throw new EduException('WEAK_PASSWORD', message);
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
    const currentDateTime = await this.externalApiService.getCurrentTime();

    const existingToken = await this.prismaService.authToken.findFirst({
      where: {
        user: { id: userId },
        expiresAt: { gt: currentDateTime },
      },
    });

    if (existingToken) {
      const newExpiresAt = new Date(currentDateTime.getTime() + 24 * 3600000);
      return this.prismaService.authToken.update({
        where: { id: existingToken.id },
        data: { expiresAt: newExpiresAt },
      });
    }

    const token = this.jwtService.sign({ userId }, { expiresIn: '24h' });

    const expiresAt = new Date(currentDateTime.getTime() + 24 * 3600000);

    return this.prismaService.authToken.create({
      data: {
        token: token,
        expiresAt: expiresAt,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async authenticateAccessKey(accessKey: string): Promise<AuthResponseDto> {
    const user = await this.prismaService.user.findFirst({
      where: { accessKey: { equals: accessKey, mode: 'insensitive' } },
    });

    if (!user) {
      throw new EduException('USER_NOT_FOUND');
    }

    if (!user.emailConfirmed) {
      throw new EduException('USER_NOT_CONFIRMED');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      document: user.document,
      email: user.email,
      id: user.id,
      name: user.name,
    };
  }
}
