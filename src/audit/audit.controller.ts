import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AuditDto } from './dto/audit.dto';
import { ApiPaginatedResponse } from 'src/common/pagination/pagination-decorator';

@Controller('audit')
@ApiTags('Auditoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar operações realizadas no painel administrativo',
  })
  @ApiPaginatedResponse(AuditDto)
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
