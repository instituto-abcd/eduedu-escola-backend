import { ApiProperty } from '@nestjs/swagger';

export class SchoolYearDto {
  @ApiProperty({ description: 'ID do ano escolar' })
  id: string;

  @ApiProperty({ description: 'Nome do ano escolar' })
  name: number;
}
