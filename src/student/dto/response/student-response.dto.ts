import { ApiProperty } from '@nestjs/swagger';

export class StudentResponseDto {
  @ApiProperty({
    description: 'Identificador',
    example: '26c18e10-ffaf-4ec1-92df-b336e9f43525',
  })
  id: string;

  @ApiProperty({ description: 'Nome', example: 'Pedrinho' })
  name: string;

  @ApiProperty({ description: 'Registro', example: '1234' })
  registry: string;

  @ApiProperty({
    description: 'Identificador da Turma',
    example: 'f2032caa-e8f8-48b4-a109-daef805ee24b',
  })
  schoolClassId: string;

  @ApiProperty({ description: 'Nome da Turma', example: '1º A' })
  schoolClassName: string;

  @ApiProperty({ description: 'Período da Turma', example: 'Manhã' })
  schoolPeriod: string;

  @ApiProperty({ description: 'Série da Turma', example: 'Infantil' })
  schoolGrade: string;

  @ApiProperty({ description: 'CFO', example: '30%' })
  cfo?: string;

  @ApiProperty({ description: 'SEA', example: '50%' })
  sea?: string;

  @ApiProperty({ description: 'LCT', example: '80%' })
  lct?: string;

  @ApiProperty({ description: 'Status', example: 'ACTIVE' })
  status: string;
}
