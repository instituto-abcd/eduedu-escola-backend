import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EduSchoolException } from '../exceptions/edu-school.exception';
import { PaginationResponse } from './dto/pagination-response.ts .dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, document } = createUserDto;

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new EduSchoolException(
        'EMAIL_CONFLICT',
        'E-mail já cadastrado',
        HttpStatus.CONFLICT,
      );
    }

    const existingPersonalDocument = await this.prisma.user.findUnique({
      where: { document },
    });
    if (existingPersonalDocument) {
      throw new EduSchoolException(
        'PERSONAL_DOCUMENT_CONFLICT',
        'Documento pessoal já cadastrado',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.user.create({
      data: createUserDto,
      include: { school: true },
    });
  }
  async findAll(
    pageNumber: number,
    pageSize: number,
    filters: any,
  ): Promise<PaginationResponse<User>> {
    if (pageNumber <= 0 || pageSize <= 0) {
      throw new EduSchoolException(
        'BAD_REQUEST',
        'Número da página ou tamanho por página inválido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { name, email, document, profile } = filters || {};

    const where = {
      name: name ? { contains: name } : undefined,
      email: email ? { contains: email } : undefined,
      document: document ? { contains: document } : undefined,
      profile: profile ? { equals: profile } : undefined,
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

      return new PaginationResponse(users, pagination);
    } catch (error) {
      throw new EduSchoolException(
        'DATABASE_ERROR',
        'Database error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new EduSchoolException(
        'USER_NOT_FOUND',
        'Usuário não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new EduSchoolException(
        'USER_NOT_FOUND',
        'Usuário não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (updateUserDto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: updateUserDto.email, id: { not: id } },
      });
      if (existingEmail) {
        throw new EduSchoolException(
          'EMAIL_CONFLICT',
          'E-mail já cadastrado por outro usuário',
          HttpStatus.CONFLICT,
        );
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
        throw new EduSchoolException(
          'PERSONAL_DOCUMENT_CONFLICT',
          'Documento pessoal já cadastrado por outro usuário',
          HttpStatus.CONFLICT,
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updated_at: new Date(),
      },
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
