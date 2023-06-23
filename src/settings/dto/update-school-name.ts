import { ApiProperty } from '@nestjs/swagger';

export class UpdateSchoolNameDto {
  @ApiProperty({ description: 'Novo nome da escola', example: 'Nova Escola' })
  schoolName: string;
}
