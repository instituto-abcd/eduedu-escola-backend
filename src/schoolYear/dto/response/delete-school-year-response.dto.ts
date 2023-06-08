import { ApiProperty } from '@nestjs/swagger';

export class DeleteSchoolYearResponseDto {
  @ApiProperty({ description: 'Exclusão com Sucesso?', example: true })
  success: boolean;
}
