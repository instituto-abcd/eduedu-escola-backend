import { ApiProperty } from '@nestjs/swagger';

export class TeacherDto {
  @ApiProperty({ description: 'ID do professor' })
  id: string;

  @ApiProperty({ description: 'Nome do professor' })
  name: string;
}
