import { ApiProperty } from '@nestjs/swagger';

export class UserSchoolClassesDto {
  @ApiProperty({ description: 'ID da turma' })
  id: string;

  @ApiProperty({ description: 'Nome da turma' })
  name: string;
}
