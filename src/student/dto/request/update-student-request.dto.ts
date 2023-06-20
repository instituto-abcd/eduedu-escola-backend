import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class UpdateStudentRequestDto {
  @ApiProperty({ description: 'Nome completo' })
  name: string;

  @ApiProperty({ description: 'Registro' })
  registry: string;

  @ApiProperty({ description: 'Status do Estudante', example: 'ACTIVE' })
  status: Status;

  @ApiProperty({ description: 'Identificador da Turma' })
  schoolClassId: string;
}
