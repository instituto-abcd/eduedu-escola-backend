import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserRequestDto } from './dto/request/create-user-request.dto';
import { UpdateUserRequestDto } from './dto/request/update-user-request.dto';
import { EduException } from '../common/exceptions/edu-school.exception';
import { PaginationResponse } from './dto/response/pagination-response.dto';
import { Prisma, Profile, Status } from '@prisma/client';
import { UserResponseDto } from './dto/response/user-response.dto';
import { DeleteUserResponseDto } from './dto/response/delete-user-response.dto';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';
import { InativeUserResponseDto } from './dto/response/inative-user-response.dto';
import { InativeUserRequestDto } from './dto/request/inative-user-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { BcryptService } from '../common/services/bcrypt.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationUtilsService: ValidationUtilsService,
    private readonly bcryptService: BcryptService,
  ) {}

  async create(
    createUserDto: CreateUserRequestDto,
    schoolId: string,
  ): Promise<UserResponseDto> {
    const { name, email, profile, password } = createUserDto;
    let { document } = createUserDto;

    if (!name || !email || !document || !profile) {
      throw new EduException('MISSING_REQUIRED_FIELDS');
    }

    if (!this.validationUtilsService.isValidEmail(email)) {
      throw new EduException('INVALID_EMAIL');
    }

    document = document.replace(/-/g, '');
    if (!this.validationUtilsService.isValidDocument(document)) {
      throw new EduException('INVALID_DOCUMENT');
    }

    if (!this.validationUtilsService.isValidProfile(profile)) {
      throw new EduException('INVALID_PROFILE');
    }

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

    const hashedPassword = await this.bcryptService.hashPassword(password);
    let accessKey = this.generateUniqueAccessKey();

    while (await this.isAccessKeyTaken(accessKey)) {
      accessKey = this.generateUniqueAccessKey();
    }

    const data: Prisma.UserUncheckedCreateInput = {
      ...createUserDto,
      document: document,
      password: hashedPassword,
      profile: profile as Profile,
      status: Status.ACTIVE,
      accessKey: accessKey,
      schoolId,
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
      accessKey: createdUser.accessKey,
      document: createdUser.document,
      profile: createdUser.profile,
    };
  }

  async findAll(
    pageNumber: number,
    pageSize: number,
    filters: any,
  ): Promise<PaginationResponse<UserResponseDto>> {
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber <= 0 ||
      !Number.isInteger(pageSize) ||
      pageSize <= 0
    ) {
      throw new EduException('INVALID_PAGINATION_PARAMETERS');
    }

    const { name, email, document, profile } = filters || {};

    const where: Prisma.UserWhereInput = {
      name: name ? { contains: name, mode: 'insensitive' } : undefined,
      email: email ? { contains: email, mode: 'insensitive' } : undefined,
      document: document
        ? { contains: document, mode: 'insensitive' }
        : undefined,
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

      const responseUsers: UserResponseDto[] = users.map((user) => ({
        id: user.id,
        status: user.status,
        name: user.name,
        email: user.email,
        accessKey: user.accessKey,
        document: user.document,
        profile: user.profile,
      }));

      return new PaginationResponse(responseUsers, pagination);
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new EduException('USER_NOT_FOUND');
    }

    return {
      id: user.id,
      status: user.status,
      name: user.name,
      accessKey: user.accessKey,
      email: user.email,
      document: user.document,
      profile: user.profile,
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
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
    const data: Prisma.UserUpdateInput = {
      ...rest,
      updatedAt: new Date(),
      profile: Profile[profile],
      accessKey: existingUser.accessKey,
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
      accessKey: updatedUser.accessKey,
      document: updatedUser.document,
      profile: updatedUser.profile,
    };
  }

  async remove(ids: string[]): Promise<DeleteUserResponseDto> {
    if (!ids || ids.length === 0) {
      throw new EduException('IDS_REQUIRED');
    }

    await this.prisma.userSchoolClass.deleteMany({
      where: {
        userId: {
          in: ids,
        },
      },
    });

    const deleteResult = await this.prisma.user.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (deleteResult.count === 0) {
      throw new EduException('USERS_NOT_FOUND');
    }

    return { success: true };
  }

  async deactivateUsers(
    requestDto: InativeUserRequestDto,
  ): Promise<InativeUserResponseDto> {
    try {
      const { ids } = requestDto;

      if (!ids || ids.length === 0) {
        throw new EduException('IDS_REQUIRED');
      }

      const users = await this.prisma.user.findMany({
        where: { id: { in: ids } },
      });

      const existingUserIds = users.map((user) => user.id);

      await this.prisma.user.updateMany({
        where: { id: { in: existingUserIds }, status: Status.ACTIVE },
        data: { status: Status.INACTIVE },
      });

      const success = existingUserIds.length > 0;

      return { success };
    } catch (error) {
      if (error instanceof EduException) {
        throw error;
      }
      throw new EduException('DATABASE_ERROR');
    }
  }

  private generateUniqueAccessKey(): string {
    return uuidv4().replace(/-/g, '').substr(0, 10);
  }

  private async isAccessKeyTaken(accessKey: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { accessKey } });
    return !!user;
  }
}
