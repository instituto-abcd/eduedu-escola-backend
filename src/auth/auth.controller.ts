import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException, UseGuards
} from "@nestjs/common";
import {
  ApiBadRequestResponse, ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import { AuthService } from './auth.service';
import { AuthRequestDto } from './dto/request/auth-request.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { ResetPasswordDto } from './dto/request/reset-password-request.dto';
import { ChangePasswordDto } from './dto/request/change-password-resquest.dto';
import { ResetPasswordResponseDto } from './dto/response/reset-password-response.dto';
import { ChangePasswordResponseDto } from './dto/response/change-password-response.dto';
import { Request } from 'express';
import { AuthAccessKeyDto } from './dto/request/AuthAccessKey.dto';
import { UserGuard } from "./guard/user.guard";

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiOperation({ summary: 'Realizar login' })
  @ApiCreatedResponse({
    description: 'Login bem-sucedido',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  @ApiResponse({ status: 401, description: 'Email ou senha inválidos' })
  async login(
    @Body() authRequestDto: AuthRequestDto,
  ): Promise<AuthResponseDto> {
    const authResponseDto = await this.authService.authenticateUser(
      authRequestDto,
    );
    if (!authResponseDto) {
      throw new UnauthorizedException('INVALID_EMAIL_OR_PASSWORD');
    }
    return authResponseDto;
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha' })
  @ApiCreatedResponse({
    description: 'Token de redefinição de senha gerado com sucesso',
    type: ResetPasswordResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<ResetPasswordResponseDto> {
    const { email } = resetPasswordDto;
    return await this.authService.resetPassword(email, req.headers.origin);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Alterar senha' })
  @ApiCreatedResponse({
    description: 'Senha alterada com sucesso',
    type: ChangePasswordResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Requisição inválida' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const { token, password, passwordConfirmation } = changePasswordDto;
    return await this.authService.changePassword(
      token,
      password,
      passwordConfirmation,
    );
  }

  @Post('access-key')
  @ApiOperation({ summary: 'Autenticar via chave (código) de acesso' })
  @ApiResponse({
    status: 200,
    description: 'Autenticação bem-sucedida',
    type: AuthResponseDto,
  })
  @ApiBody({ type: AuthAccessKeyDto })
  async authenticateAccessKey(@Body() body: AuthAccessKeyDto) {
    return this.authService.authenticateAccessKey(body.accessKey);
  }

  @Post('logout')
  @UseGuards(UserGuard)
  @ApiBearerAuth()
  async logout(@Req() req: any) {
    const userId = req.user.id;

    await this.authService.logout(userId);

    return { message: 'Usuário desconectado com sucesso' };
  }
}
