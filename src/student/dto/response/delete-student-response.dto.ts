import { ApiProperty } from '@nestjs/swagger';

export class DeleteStudentResponseDto {
  @ApiProperty({ description: 'Exclusão com Sucesso?', example: true })
  success: boolean;
}
