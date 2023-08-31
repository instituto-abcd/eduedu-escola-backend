import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserRequestDto } from './dto/request/update-user-request.dto';
import { User } from './dto/user.entity';
import { SchoolId } from '../common/school-id.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationResponse } from '../common/pagination/pagination-response.dto';
import { ErrorDetails } from '../common/exceptions/edu-school.exception';
import { CreateUserRequestDto } from './dto/request/create-user-request.dto';
import { UserResponseDto } from './dto/response/user-response.dto';
import { DeleteUserResponseDto } from './dto/response/delete-user-response.dto';
import { DeleteUserRequestDto } from './dto/request/delete-user-request.dto';
import { InativeUserRequestDto } from './dto/request/inative-user-request.dto';
import { InativeUserResponseDto } from './dto/response/inative-user-response.dto';
import { UserAccessCodeResponseDto } from './dto/response/user-access-code-response.dto';
import { UserGuard } from 'src/auth/guard/user.guard';
import { UpdatePasswordRequestDto } from './dto/request/update-password-request.dto';
import { AuthResponseDto } from 'src/auth/dto/response/auth-response.dto';
import { AuditGuard } from 'src/common/guard/audit.guard';
import { Request } from 'express';
import { UserSchoolClassesDto } from './dto/response/user-classes.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Usuário')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @AuditGuard()
  @Post()
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  @ApiResponse({
    status: ErrorDetails.EMAIL_CONFLICT.status,
    description: ErrorDetails.EMAIL_CONFLICT.message,
  })
  @ApiResponse({
    status: ErrorDetails.PERSONAL_DOCUMENT_CONFLICT.status,
    description: ErrorDetails.PERSONAL_DOCUMENT_CONFLICT.message,
  })
  @ApiOperation({ summary: 'Criar um novo usuário' })
  async createUser(
    @Body() createUserDto: CreateUserRequestDto,
    @SchoolId() schoolId: string,
    @Req() request: Request,
  ): Promise<UserResponseDto> {
    return this.userService.create(
      createUserDto,
      schoolId,
      request.headers.origin,
    );
  }

  @Get('all')
  @ApiResponse({
    status: 200,
    description: 'Usuários encontrados com sucesso',
    type: PaginationResponse,
  })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  @ApiResponse({
    status: ErrorDetails.INVALID_PAGINATION_PARAMETERS.status,
    description: ErrorDetails.INVALID_PAGINATION_PARAMETERS.message,
  })
  @ApiOperation({ summary: 'Obter todos os usuários' })
  async findAll(
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('document') document?: string,
    @Query('profile') profile?: string,
    @Query('status') status?: string,
  ): Promise<PaginationResponse<UserResponseDto>> {
    const pageNumber = parseInt(page || '1');
    const pageSize = parseInt(limit || '10');

    const filters = {
      name,
      email,
      document,
      profile,
      status,
    };

    return this.userService.findAll(pageNumber, pageSize, filters);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado com sucesso',
    type: User,
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiOperation({ summary: 'Obter usuário por ID' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: User,
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  @ApiOperation({ summary: 'Atualizar usuário por ID' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  @AuditGuard()
  @Delete()
  @ApiResponse({
    status: 200,
    description: 'Usuários removidos com sucesso',
    type: DeleteUserResponseDto,
  })
  @ApiOperation({ summary: 'Excluir usuários' })
  async remove(
    @Body() requestDto: DeleteUserRequestDto,
  ): Promise<DeleteUserResponseDto> {
    const { ids } = requestDto;
    return this.userService.remove(ids);
  }

  @Post('inactivate')
  @ApiOperation({ summary: 'Desativar usuários' })
  @ApiResponse({
    status: 200,
    description: 'Usuários desativados com sucesso',
    type: InativeUserRequestDto,
  })
  async deactivateUsers(
    @Body() requestDto: InativeUserRequestDto,
  ): Promise<InativeUserResponseDto> {
    return this.userService.deactivateUsers(requestDto);
  }

  @Get(':id/access-key')
  @ApiOperation({ summary: 'Obter Código de Acesso do Usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Código de Acesso do Usuário',
    type: UserAccessCodeResponseDto,
  })
  async getAccessCode(
    @Param('id') userId: string,
  ): Promise<UserAccessCodeResponseDto> {
    return await this.userService.getAccessCode(userId);
  }

  @Put(':id/access-key')
  @ApiOperation({ summary: 'Atualizar Código de Acesso do Usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Código de Acesso atualizado do Usuário',
    type: UserAccessCodeResponseDto,
  })
  async updateAccessCode(
    @Param('id') userId: string,
  ): Promise<UserAccessCodeResponseDto> {
    return await this.userService.updateAccessCode(userId);
  }

  @ApiOperation({ summary: 'Trocar a senha do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Alteração de senha realizada com sucesso',
    type: AuthResponseDto,
  })
  @UseGuards(UserGuard)
  @Put('password')
  async updatePassword(
    @Req() request,
    @Body() { newPassword, oldPassword }: UpdatePasswordRequestDto,
  ): Promise<AuthResponseDto> {
    return this.userService.updatePassword(
      request.user,
      oldPassword,
      newPassword,
    );
  }
  @ApiOperation({ summary: 'Turmas do usuário logado' })
  @ApiResponse({
    status: 200,
    type: [UserSchoolClassesDto],
  })
  @UseGuards(UserGuard)
  @Get('school-classes/all')
  async schoolClasses(@Req() req) {
    const user: User = req.user;
    return this.userService.userClasses(user.id, user.profile);
  }
}
