import { ApiProperty } from '@nestjs/swagger';

export class Summary {
  @ApiProperty({ description: 'O número total de turmas escolares.' })
  totalSchoolClasses: number;

  @ApiProperty({ description: 'O número total de estudantes.' })
  totalStudents: number;

  @ApiProperty({ description: 'O número total de professores.' })
  totalTeachers: number;

  @ApiProperty({ description: 'O botão está habilitado?' })
  buttonEnabled: boolean;
}
