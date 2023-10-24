export class ExamPerformanceDto {
  axis: string;
  percentage: string;
  color: string;
}

export class PlanetPerformanceDto {
  axis: string;
  percentage: string;
}

export class SchoolClassDto {
  id: string;
  name: string;
  studentsCounter: number;
  examPerformance: ExamPerformanceDto[];
  planetPerformance: PlanetPerformanceDto[];
}

export class SchoolGradeDto {
  id: string;
  name: string;
  teachersCounter: number;
  schoolClassesCounter: number;
  studentsCounter: number;
  schoolClasses: SchoolClassDto[];
}

export class DashboardDto {
  schoolYear: number;
  teachersCounter: number;
  schoolClassesCounter: number;
  studentsCounter: number;
  schoolGrades: SchoolGradeDto[];
}
