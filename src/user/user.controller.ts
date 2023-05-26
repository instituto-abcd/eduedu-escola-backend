import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationResponse } from './dto/pagination-response.dto';
import { SchoolId } from '../common/school-id.decorator';

@ApiBearerAuth()
@ApiTags('Usuário')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: User,
  })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @SchoolId() schoolId: string,
  ): Promise<User> {
    createUserDto.schoolId = schoolId || '';
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Usuários encontrados com sucesso',
    type: PaginationResponse,
  })
  @ApiBadRequestResponse({ description: 'Erro na requisição' })
  async findAll(
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('document') document?: string,
    @Query('profile') profile?: string,
  ): Promise<PaginationResponse<User>> {
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
  async findOne(@Param('id') id: string): Promise<User> {
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
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Usuário removido com sucesso',
    type: User,
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async remove(@Param('id') id: string): Promise<User> {
    return this.userService.remove(id);
  }
}
