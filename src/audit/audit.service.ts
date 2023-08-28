import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationResponse } from 'src/common/pagination/pagination-response.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { endOfDay, startOfDay } from 'date-fns';
import { EduException } from "../common/exceptions/edu-school.exception";

type ListParams = {
  userId?: string;
  action?: string;
  entity?: string;
  pageNumber: number;
  pageSize: number;
  createdAt?: Date;
};

@Injectable()
export class AuditService {
  constructor(private readonly prismaService: PrismaService) {}

  async list(params: ListParams) {
    if (
      !Number.isInteger(params.pageNumber) ||
      params.pageNumber <= 0 ||
      !Number.isInteger(params.pageSize) ||
      params.pageSize <= 0
    ) {
      throw new EduException('INVALID_PAGINATION_PARAMETERS');
    }

    const whereFilter: Prisma.AuditWhereInput = {
      userId: params.userId,
      action: params.action && { contains: params.action, mode: 'insensitive' },
      entity: params.entity && { contains: params.entity, mode: 'insensitive' },
      createdAt: params.createdAt && {
        lte: endOfDay(params.createdAt),
        gte: startOfDay(params.createdAt),
      },
    };

    try {
      const totalCount = await this.prismaService.audit.count({
        where: whereFilter,
      });

      const totalPages = Math.ceil(totalCount / params.pageSize);
      const skip = (params.pageNumber - 1) * params.pageSize;

      const audit = await this.prismaService.audit.findMany({
        where: whereFilter,
        skip,
        take: params.pageSize,
      });

      const pagination = {
        totalItems: totalCount,
        pageSize: params.pageSize,
        pageNumber: params.pageNumber,
        totalPages: totalPages,
        previousPage: params.pageNumber > 1 ? params.pageNumber - 1 : 0,
        nextPage: params.pageNumber < totalPages ? params.pageNumber + 1 : 0,
        lastPage: totalPages,
        hasPreviousPage: params.pageNumber > 1,
        hasNextPage: params.pageNumber < totalPages,
      };

      return new PaginationResponse(audit, pagination);
    } catch (error) {
      throw new EduException('DATABASE_ERROR');
    }
  }
}
