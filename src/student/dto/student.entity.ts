import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '@prisma/client';

export class Student {
  @ApiProperty({ description: 'Identificador' })
  id: string;

  @ApiProperty({ description: 'Nome completo' })
  name: string;

  @ApiProperty({ description: 'Registro' })
  registry: string;

  @ApiProperty({ description: 'Status' })
  status: string;

  @ApiProperty({ description: 'Identificador da Turma' })
  schoolClassId: string;
}
