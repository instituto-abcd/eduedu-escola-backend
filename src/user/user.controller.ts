import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { SchoolId } from '../common/school-id.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationResponse } from './dto/pagination-response.dto';
import { ErrorDetails } from '../exceptions/edu-school.exception';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@ApiBearerAuth()
@ApiTags('Usuário')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: User,
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
  @ApiOperation({ summary: 'Criar um novo aluno' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @SchoolId() schoolId: string,
  ): Promise<ResponseUserDto> {
    return this.userService.create(createUserDto, schoolId);
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
  @ApiOperation({ summary: 'Obter todos os alunos' })
  async findAll(
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('document') document?: string,
    @Query('profile') profile?: string,
  ): Promise<PaginationResponse<ResponseUserDto>> {
    const pageNumber = parseInt(page || '1');
    const pageSize = parseInt(limit || '10');

    const filters = {
      name,
      email,
      document,
      profile,
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
  @ApiOperation({ summary: 'Obter aluno por ID' })
  async findOne(@Param('id') id: string): Promise<ResponseUserDto> {
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
  @ApiOperation({ summary: 'Atualizar aluno por ID' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Usuário removido com sucesso',
    type: User,
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiOperation({ summary: 'Excluir um aluno' })
  async remove(@Param('id') id: string): Promise<DeleteUserDto> {
    return this.userService.remove(id);
  }
}
