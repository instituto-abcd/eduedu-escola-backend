import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthRequestDto } from './dto/request/auth-request.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { ResetPasswordDto } from './dto/request/reset-password-request.dto';
import { ChangePasswordDto } from './dto/request/change-password-resquest.dto';
import { ResetPasswordResponseDto } from './dto/response/reset-password-response.dto';
import { ChangePasswordResponseDto } from './dto/response/change-password-response.dto';
import { Request } from 'express';
import { AuthAccessKeyDto } from './dto/request/AuthAccessKey.dto';
import { UserGuard } from './guard/user.guard';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*
   *  Login
   */

  @Post()
  @ApiOperation({ summary: 'Logar no administrativo (diretor ou professor)' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Corpo da requisição inválido' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
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

  /*
   *  Reset de senha
   */

  @Post('reset-password')
  @ApiOperation({
    summary: 'Redefinir senha',
    description:
      'Gera um Token e o envia para o email do usuário junto de um link, que ao acessá-lo, será verificado a integridade do token e se este for válido o usuário será permitido inputar uma nova senha',
  })
  @ApiCreatedResponse({
    description: 'Token gerado e link enviado para o e-mail',
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

  /*
   *  Alteração de senha
   */

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

  /*
   *  Chaves de acesso
   *  - endpoint não utilizado
   */

  @Post('access-key')
  @ApiOperation({
    summary: 'Autenticar via chave (código) de acesso',
    deprecated: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticação bem-sucedida',
    type: AuthResponseDto,
  })
  @ApiBody({ type: AuthAccessKeyDto })
  async authenticateAccessKey(@Body() body: AuthAccessKeyDto) {
    return this.authService.authenticateAccessKey(body.accessKey);
  }

  /*
   *  Logout
   */

  @Post('logout')
  @UseGuards(UserGuard)
  @ApiBearerAuth()
  async logout(@Req() req: any) {
    const userId = req.user.id;

    await this.authService.logout(userId);
    return { message: 'Usuário desconectado com sucesso' };
  }
}
