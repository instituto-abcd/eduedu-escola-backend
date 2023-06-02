import { ApiProperty } from '@nestjs/swagger';

export class SchoolYearSummary {
  @ApiProperty({ description: 'O resumo do ano letivo.' })
  summary: {
    totalStudents: number;
    buttonEnabled: boolean;
    totalSchoolClasses: number;
    totalTeachers: number;
  };

  @ApiProperty({ description: 'O id do ano letivo.' })
  id: string;

  @ApiProperty({ description: 'O nome do ano letivo.' })
  name: number;

  @ApiProperty({ description: 'O status do ano letivo.' })
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';

  @ApiProperty({ description: 'A data de criação do ano letivo.' })
  createdAt: Date;

  @ApiProperty({ description: 'A data da última atualização do ano letivo.' })
  updatedAt: Date;
}
