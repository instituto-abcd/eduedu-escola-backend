import { ApiProperty } from '@nestjs/swagger';

export class CreateSchoolClassDto {
  @ApiProperty({ description: 'Nome da classe escolar', example: '1º A' })
  name: string;

  @ApiProperty({
    description: 'Série escolar',
    enum: ['CHILDREN', 'FIRST_GRADE', 'SECOND_GRADE', 'THIRD_GRADE'],
  })
  schoolGrade: 'CHILDREN' | 'FIRST_GRADE' | 'SECOND_GRADE' | 'THIRD_GRADE';

  @ApiProperty({
    description: 'Período escolar',
    enum: ['MORNING', 'AFTERNOON', 'FULL'],
  })
  schoolPeriod: 'MORNING' | 'AFTERNOON' | 'FULL';

  @ApiProperty({
    description: 'ID do ano letivo',
    example: '3a224fb1-ec95-456c-bf6f-ef877928b9b6',
  })
  schoolYearId: string;

  @ApiProperty({
    description: 'IDs dos professores',
    example: [
      '4d63086b-5b83-418b-bb28-761e5accb978',
      'e57136f7-9df1-4644-b9a7-bfddfd799c77',
      '274f258c-cf3b-4bbc-b0cf-48a12f95657f',
    ],
    type: [String],
  })
  teacherIds: string[];
}
