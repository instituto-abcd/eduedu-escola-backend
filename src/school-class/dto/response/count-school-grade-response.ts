import { ApiProperty } from '@nestjs/swagger';
import { SchoolGradeEnum } from '@prisma/client';

export class CountSchoolGradeResponseDto {
  @ApiProperty({ description: 'Série escolar', example: 'CHILDREN' })
  schoolGrade: SchoolGradeEnum;

  @ApiProperty({ description: 'Total de turmas', example: 5 })
  count: number;
}
