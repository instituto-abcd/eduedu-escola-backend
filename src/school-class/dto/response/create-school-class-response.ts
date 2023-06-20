import { ApiProperty } from '@nestjs/swagger';

export class CreateSchoolClassResponseDto {
  @ApiProperty({ description: 'ID da classe escolar' })
  id: string;

  @ApiProperty({ description: 'Nome da classe escolar' })
  name: string;

  @ApiProperty({ description: 'Série escolar' })
  schoolGrade: string;

  @ApiProperty({ description: 'Período escolar' })
  schoolPeriod: string;

  @ApiProperty({ description: 'Data de criação da classe escolar' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização da classe escolar' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de professores associados à classe escolar',
    type: [String],
  })
  teachers: string[];
}
