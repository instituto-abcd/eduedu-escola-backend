import { ApiProperty } from '@nestjs/swagger';

export class ActivateSchoolYearDto {
  @ApiProperty({
    description: 'ID do ano letivo',
    example: '4f4403fd-034f-46e8-80dd-a04bc87862c6',
  })
  id: string;
}