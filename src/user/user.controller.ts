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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserRequestDto } from './dto/request/update-user-request.dto';
import { User } from './dto/user.entity';
import { SchoolId } from '../common/school-id.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationResponse } from '../common/pagination/pagination-response.dto';
import { ErrorDetails } from '../common/exceptions/edu-school.exception';
import { CreateUserRequestDto } from './dto/request/create-user-request.dto';
import { UserResponseDto } from './dto/response/user-response.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { AddUsersResponseDto } from './dto/response/add-users-response.dto';
import { DeleteUserResponseDto } from './dto/response/delete-user-response.dto';
import { DeleteUserRequestDto } from './dto/request/delete-user-request.dto';
import { InativeUserRequestDto } from './dto/request/inative-user-request.dto';
import { InativeUserResponseDto } from './dto/response/inative-user-response.dto';
import { UserAccessCodeResponseDto } from './dto/response/user-access-code-response.dto';
import { UserAccessCodeOptionResponseDto } from './dto/response/user-access-code-option-response.dto';
import { UserGuard } from '../auth/guard/user.guard';
import { UpdatePasswordRequestDto } from './dto/request/update-password-request.dto';
import { AuthResponseDto } from '../auth/dto/response/auth-response.dto';
import { AuditGuard } from '../common/guard/audit.guard';
import { EduException } from '../common/exceptions/edu-school.exception';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Response } from 'express';
import { join } from 'path';
import { UserSchoolClassesDto } from './dto/response/user-classes.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ApiPaginatedResponse } from 'src/common/pagination/pagination-decorator';

@ApiTags('Usuário')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @AuditGuard()
  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    status: ErrorDetails.EMAIL_CONFLICT.status,
    description: ErrorDetails.EMAIL_CONFLICT.message,
  })
  @ApiBadRequestResponse({
    status: ErrorDetails.PERSONAL_DOCUMENT_CONFLICT.status,
    description: ErrorDetails.PERSONAL_DOCUMENT_CONFLICT.message,
  })
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @AuditGuard()
  @Post('/spreadsheet')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Criar usuários cadastrados na planilha' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async addUsersFromSpreadsheet(
    @SchoolId() schoolId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ): Promise<AddUsersResponseDto> {
    const usersData: AddUsersDto[] = await this.userService.parseSpreadsheet(
      file,
    );

    return await this.userService.addUsers(
      usersData,
      schoolId,
      request.headers.origin,
    );
  }

  @Get('/spreadsheet-template')
  @ApiOperation({
    summary: 'Download do modelo de planilha para upload de usuários',
  })
  downloadSpreadsheetTemplate(@Res() res: Response): void {
    try {
      const templateFilePath = join(
        __dirname,
        '..',
        '..',
        'templates',
        'eduedu-escola-usuario-template.xlsx',
      );
      res.download(templateFilePath, 'eduedu-escola-usuario-template.xlsx');
    } catch (e) {
      throw new EduException('UNKNOWN_ERROR');
    }
  }

  @Get('all')
  @ApiPaginatedResponse(UserResponseDto)
  @ApiOperation({ summary: 'Listar usuários (paginado)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiOperation({ summary: 'Buscar usuário' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: UpdateUserRequestDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiOperation({ summary: 'Atualizar usuário' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  @AuditGuard()
  @Delete()
  @ApiResponse({ type: DeleteUserResponseDto })
  @ApiOperation({ summary: 'Excluir usuários' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(
    @Body() requestDto: DeleteUserRequestDto,
  ): Promise<DeleteUserResponseDto> {
    const { ids } = requestDto;
    return this.userService.remove(ids);
  }

  @Post('inactivate')
  @ApiOperation({ summary: 'Desativar usuários' })
  @ApiResponse({ type: InativeUserRequestDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deactivateUsers(
    @Body() requestDto: InativeUserRequestDto,
  ): Promise<InativeUserResponseDto> {
    return this.userService.deactivateUsers(requestDto);
  }

  @Get(':id/access-key')
  @ApiOperation({ summary: 'Código de Acesso do Usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: 'string' })
  @ApiOkResponse({ type: UserAccessCodeResponseDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAccessCode(
    @Param('id') userId: string,
  ): Promise<UserAccessCodeResponseDto> {
    return await this.userService.getAccessCode(userId);
  }

  @Put(':id/access-key')
  @ApiOperation({ summary: 'Atualizar Código de Acesso do Usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: 'string' })
  @ApiResponse({ type: UserAccessCodeResponseDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateAccessCode(
    @Param('id') userId: string,
  ): Promise<UserAccessCodeResponseDto> {
    return await this.userService.updateAccessCode(userId);
  }

  @Get(':schoolClassId/access-key-options')
  @ApiOperation({
    summary: 'Lista com 3 códigos de acesso inválidos e apenas 1 válido',
    description: 'Usado no portal aluno no fluxo de login de aluno/turma',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: 'string' })
  @ApiResponse({ type: UserAccessCodeOptionResponseDto, isArray: true })
  async getAccessCodeOptions(
    @Param('schoolClassId') schoolClassId: string,
  ): Promise<UserAccessCodeOptionResponseDto[]> {
    const userId = await this.userService.getFirstUserIdBySchoolClassId(
      schoolClassId,
    );
    return await this.userService.getAccessCodeOptions(userId);
  }

  @ApiOperation({ summary: 'Trocar a senha do usuário logado' })
  @ApiOkResponse({ type: AuthResponseDto })
  @UseGuards(UserGuard)
  @ApiBearerAuth()
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

  @ApiOperation({ summary: 'Turmas do usuário (autenticado)' })
  @ApiOkResponse({ type: UserSchoolClassesDto, isArray: true })
  @UseGuards(UserGuard)
  @ApiBearerAuth()
  @Get('school-classes/all')
  async schoolClasses(@Req() req) {
    const user: User = req.user;
    return this.userService.userClasses(user.id, user.profile);
  }
}
