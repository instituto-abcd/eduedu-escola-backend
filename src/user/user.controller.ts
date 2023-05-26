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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PaginationResponse } from './dto/pagination-response.ts .dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll(
    @Query('page-number') page = '1',
    @Query('page-size') limit = '10',
    @Query('name') name: string,
    @Query('email') email: string,
    @Query('document') document: string,
    @Query('profile') profile: string,
  ): Promise<PaginationResponse<any>> {
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    const filters = {
      name,
      email,
      document,
      profile,
    };

    return await this.userService.findAll(pageNumber, pageSize, filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<User> {
    return this.userService.remove(id);
  }
}
