import { ApiProperty } from '@nestjs/swagger';

export class StudentSimplifiedResponseDto {
  @ApiProperty({ description: 'Nome', example: 'Pedrinho' })
  name: string;

  @ApiProperty({ description: 'Registro', example: '1234' })
  registry: string;

  @ApiProperty({ description: 'Status', example: 'ACTIVE' })
  status: string;
}
