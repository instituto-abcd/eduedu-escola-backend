import { ApiProperty } from '@nestjs/swagger';
import { TeacherDto } from '../teacher.dto';
import { SchoolYearDto } from '../school-year';

export class UpdateSchoolClassRequestDto {
  @ApiProperty({ description: 'ID da classe escolar' })
  id: string;

  @ApiProperty({ description: 'Nome da classe escolar' })
  name: string;

  @ApiProperty({ description: 'Série escolar' })
  schoolGrade: string;

  @ApiProperty({ description: 'Período escolar' })
  schoolPeriod: string;

  @ApiProperty({
    description: 'Lista de professores associados à classe escolar',
    type: () => [TeacherDto],
  })
  teachers: { id: string; name: string }[];

  @ApiProperty({
    description: 'Ano escolar',
    type: SchoolYearDto,
  })
  schoolYear: SchoolYearDto;
}
