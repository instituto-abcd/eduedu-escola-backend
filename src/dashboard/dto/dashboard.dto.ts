import { ApiProperty } from '@nestjs/swagger';

export class ExamPerformanceDto {
  @ApiProperty({ description: 'Eixo' })
  axis: string;

  @ApiProperty({ description: 'Porcentagem' })
  percentage: string;

  @ApiProperty({ description: 'Código de cor #hex' })
  color: string;
}

export class PlanetPerformanceDto {
  @ApiProperty({ description: 'Eixo' })
  axis: string;

  @ApiProperty({ description: 'Porcentagem' })
  percentage: string;
}

export class SchoolClassDto {
  @ApiProperty({ description: 'ID da turma' })
  id: string;

  @ApiProperty({ description: 'Nome da turma' })
  name: string;

  @ApiProperty({ description: 'Contagem de alunos atribuídos a turma' })
  studentsCounter: number;

  @ApiProperty({
    description: 'Resultados por prova',
    type: ExamPerformanceDto,
    isArray: true,
  })
  examPerformance: ExamPerformanceDto[];

  @ApiProperty({
    description: 'Resultados por planeta',
    type: PlanetPerformanceDto,
    isArray: true,
  })
  planetPerformance: PlanetPerformanceDto[];
}

export class SchoolGradeDto {
  @ApiProperty({ description: 'ID da grade escolar' })
  id: string;

  @ApiProperty({ description: 'Nome da grade escolar' })
  name: string;

  @ApiProperty({
    description: 'Contagem de PROFESSORES atrubuídos a esta grade',
  })
  teachersCounter: number;

  @ApiProperty({ description: 'Contagem de TURMAS atrubuídas a esta grade' })
  schoolClassesCounter: number;

  @ApiProperty({ description: 'Contagem de ALUNOS atrubuídas a esta grade' })
  studentsCounter: number;

  @ApiProperty({
    description: 'Contagem de TURMAS atrubuídas a esta grade',
    type: SchoolClassDto,
    isArray: true,
  })
  schoolClasses: SchoolClassDto[];
}

export class DashboardDto {
  @ApiProperty({ description: 'Ano letivo/escolar (2024, 2025, 2026)' })
  schoolYear: number;

  @ApiProperty({ description: 'Contagem de professores cadastrados' })
  teachersCounter: number;

  @ApiProperty({ description: 'Contagem de turmas cadastradas' })
  schoolClassesCounter: number;

  @ApiProperty({ description: 'Contagem de alunos cadastrados' })
  studentsCounter: number;

  @ApiProperty({
    description:
      'Lista de grade escolar (Infantil, Primeiro Ano, Segundo etc.)',
    type: SchoolGradeDto,
    example: [],
    isArray: true,
  })
  schoolGrades: SchoolGradeDto[];
}
