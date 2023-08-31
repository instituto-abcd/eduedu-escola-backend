import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationResponse } from 'src/common/pagination/pagination-response.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('audit')
@ApiTags('Auditoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiResponse({
    status: 200,
    type: PaginationResponse,
  })
  findAll(
    @Query('page-number') page?: string,
    @Query('page-size') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('createdAt') createdAt?: string,
  ) {
    const pageNumber = parseInt(page || '1');
    const pageSize = parseInt(limit || '10');

    return this.auditService.list({
      userId,
      action,
      entity,
      pageNumber,
      pageSize,
      createdAt: createdAt && new Date(createdAt),
    });
  }
}
