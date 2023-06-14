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

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly externalApiService: DateApiService,
    private readonly bcryptService: BcryptService,
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

    if (isPasswordValid) {
      throw new EduException('INVALID_EMAIL_OR_PASSWORD');
    }

    const accessToken = this.generateAccessToken(user);
    const { id, name, email: userEmail, document } = user;
    return new AuthResponseDto(id, name, userEmail, document, accessToken);
  }

  generateAccessToken(user: User): string {
    const payload = { email: user.email, profile: user.profile };
    return this.jwtService.sign(payload);
  }

  async resetPassword(email: string): Promise<ResetPasswordResponseDto> {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new EduException('USER_NOT_FOUND');
    }

    const authToken = await this.generateAuthToken(user.id);

    return { token: authToken.token };
  }

  async changePassword(
    token: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<ChangePasswordResponseDto> {
    // Verificar se as senhas informadas são iguais
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
      // Se o token estiver expirado, excluir o AuthToken do banco de dados
      await this.prismaService.authToken.delete({
        where: { id: authToken.id },
      });
      throw new EduException('TOKEN_EXPIRED');
    }

    // Gerar o hash da nova senha
    const hashedPassword = await this.bcryptService.hashPassword(password);

    // Atualizar a senha do usuário no banco de dados
    await this.prismaService.user.update({
      where: { id: authToken.userId },
      data: { password: hashedPassword },
    });

    // Excluir o AuthToken do banco de dados
    await this.prismaService.authToken.delete({
      where: { id: authToken.id },
    });

    // Retornar uma instância de ChangePasswordResponseDto indicando o sucesso da alteração de senha
    return { success: true };
  }

  async generateAuthToken(userId: string): Promise<AuthToken> {
    const currentDateTime = await this.externalApiService.getCurrentTime();

    // Verificar se já existe um token ativo para o usuário
    const existingToken = await this.prismaService.authToken.findFirst({
      where: {
        user: { id: userId },
        expiresAt: { gt: currentDateTime }, // Verificar se a data de expiração é maior que a data atual
      },
    });

    if (existingToken) {
      // Se houver um token ativo, atualizar a data de expiração e retornar o token existente
      const newExpiresAt = new Date(currentDateTime.getTime() + 3600000); // Adicionar 1 hora à data atual

      return this.prismaService.authToken.update({
        where: { id: existingToken.id },
        data: { expiresAt: newExpiresAt },
      });
    }

    // Se não houver um token ativo, criar um novo token
    const token = this.jwtService.sign({ userId }, { expiresIn: '1h' });

    const expiresAt = new Date(currentDateTime.getTime() + 3600000); // Adicionar 1 hora à data atual

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
}
