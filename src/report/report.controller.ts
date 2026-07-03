import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ReportService } from './report.service';
import { Response } from 'express';

@Controller('report')
@ApiTags('Relatório')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/:id/student')
  @ApiOperation({ summary: 'PDF de relatório do aluno' })
  async generatePdf(@Res() res: Response, @Param('id') id: string) {
    return await this.reportService.createReportStudent(res, id);
  }
}
