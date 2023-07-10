import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationResponse } from 'src/common/pagination/pagination-response.dto';
import { PrismaService } from 'src/prisma/prisma.service';

type ListParams = {
  userId?: string;
  action?: string;
  entity?: string;
  pageNumber: number;
  pageSize: number;
};

@Injectable()
export class AuditService {
  constructor(private readonly prismaService: PrismaService) {}

  async list(params: ListParams) {
    const whereFilter: Prisma.AuditWhereInput = {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
    };

    const totalCount = await this.prismaService.audit.count({
      where: whereFilter,
    });

    const totalPages = Math.ceil(totalCount / params.pageSize);

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

    const audit = await this.prismaService.audit.findMany({
      where: whereFilter,
    });

    return new PaginationResponse(audit, pagination);
  }
}
