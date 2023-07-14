import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DateApiService } from '../common/services/date-api.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Injectable()
export class SchoolYearSchedulerService {
  private readonly logger = new Logger(SchoolYearSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApiService: DateApiService,
  ) {}

  @Cron('59 23 31 11 *', {
    name: 'EndOfYearCron',
  }) //executado no último minuto de cada ano
  async updateSchoolYearsStatus() {
    const currentYear = await this.externalApiService.getCurrentYear();

    try {
      const schoolYearsToUpdate = await this.prisma.schoolYear.findMany({
        where: {
          name: {
            lt: currentYear,
          },
        },
      });

      const updatedSchoolYears = schoolYearsToUpdate.map((schoolYear) => ({
        ...schoolYear,
        status: 'INACTIVE',
      }));

      await this.prisma.schoolYear.updateMany({
        where: {
          id: {
            in: updatedSchoolYears.map((schoolYear) => schoolYear.id),
          },
        },
        data: {
          status: 'INACTIVE',
        },
      });

      this.logger.log(
        `Atualização de status concluída: ${schoolYearsToUpdate.length} registros atualizados.`,
      );
    } catch (error) {
      this.logger.error(
        'Ocorreu um erro ao atualizar os registros de SchoolYear:',
        error,
      );
    }
  }
}
