import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EduException } from '../exceptions/edu-school.exception';
import { PaginationResponse } from './dto/pagination-response.dto';
import { Profile, Status } from '@prisma/client';
import { ResponseUserDto } from './dto/user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createUserDto: CreateUserDto,
    schoolId: string,
  ): Promise<ResponseUserDto> {
    const { email, document, profile } = createUserDto;

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new EduException('EMAIL_CONFLICT');
    }

    const existingPersonalDocument = await this.prisma.user.findUnique({
      where: { document },
    });
    if (existingPersonalDocument) {
      throw new EduException('PERSONAL_DOCUMENT_CONFLICT');
    }

    const data: any = {
      ...createUserDto,
      schoolId,
      profile: profile as any,
      status: Status.ACTIVE,
    };

    const createdUser = await this.prisma.user.create({
      data,
      include: { school: true },
    });

    return {
      id: createdUser.id,
      status: createdUser.status,
      name: createdUser.name,
      email: createdUser.email,
      document: createdUser.document,
      profile: createdUser.profile,
    };
  }

  async findAll(
    pageNumber: number,
    pageSize: number,
    filters: any,
  ): Promise<PaginationResponse<ResponseUserDto>> {
    if (pageNumber <= 0 || pageSize <= 0) {
      throw new EduException('INVALID_PAGINATION_PARAMETERS');
    }

    const { name, email, document, profile } = filters || {};

    const where = {
      name: name ? { contains: name } : undefined,
      email: email ? { contains: email } : undefined,
      document: document ? { contains: document } : undefined,
      profile: profile ? { equals: Profile[profile] } : undefined,
    };

    try {
      const [totalCount, users] = await Promise.all([
        this.prisma.user.count({ where }),
        this.prisma.user.findMany({
          where,
          skip: (pageNumber - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      const pagination = {
        totalItems: totalCount,
        pageSize: pageSize,
        pageNumber: pageNumber,
        totalPages: totalPages,
        previousPage: pageNumber > 1 ? pageNumber - 1 : 0,
        nextPage: pageNumber < totalPages ? pageNumber + 1 : 0,
        lastPage: totalPages,
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < totalPages,
      };

      const responseUsers: ResponseUserDto[] = users.map((user) => ({
        id: user.id,
        status: user.status,
        name: user.name,
        email: user.email,
        document: user.document,
        profile: user.profile,
      }));

      return new PaginationResponse(responseUsers, pagination);
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
  }

  async findOne(id: string): Promise<ResponseUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new EduException('USER_NOT_FOUND');
    }

    return {
      id: user.id,
      status: user.status,
      name: user.name,
      email: user.email,
      document: user.document,
      profile: user.profile,
    };
  }
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new EduException('USER_NOT_FOUND');
    }

    if (updateUserDto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: updateUserDto.email, id: { not: id } },
      });
      if (existingEmail) {
        throw new EduException('EMAIL_CONFLICT');
      }
    }

    if (updateUserDto.document) {
      const existingPersonalDocument = await this.prisma.user.findFirst({
        where: {
          document: updateUserDto.document,
          id: { not: id },
        },
      });
      if (existingPersonalDocument) {
        throw new EduException('PERSONAL_DOCUMENT_CONFLICT');
      }
    }

    const { profile, ...rest } = updateUserDto;
    const data = {
      ...rest,
      updatedAt: new Date(),
      profile: Profile[profile],
    };

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    return {
      id: updatedUser.id,
      status: updatedUser.status,
      name: updatedUser.name,
      email: updatedUser.email,
      document: updatedUser.document,
      profile: updatedUser.profile,
    };
  }

  async remove(id: string): Promise<DeleteUserDto> {
    const user = await this.prisma.user.delete({
      where: { id },
      include: { school: true },
    });

    if (!user) {
      throw new EduException('USER_NOT_FOUND');
    }

    return { success: true };
  }
}
