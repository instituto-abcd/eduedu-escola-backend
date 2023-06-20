import { ApiProperty } from '@nestjs/swagger';

export class DeleteSchoolClassResponseDto {
  @ApiProperty({ description: 'Exclusão com Sucesso?', example: true })
  success: boolean;
}
