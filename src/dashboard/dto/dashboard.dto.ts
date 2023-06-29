export class ExamPerformanceDto {
  axis: string;
  percentage: string;
}

export class PlanetPerformanceDto {
  axis: string;
  percentage: string;
}

export class SchoolClassDto {
  name: string;
  studentsCounter: number;
  examPerformance: ExamPerformanceDto[];
  planetPerformance: PlanetPerformanceDto[];
}

export class SchoolGradeDto {
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
