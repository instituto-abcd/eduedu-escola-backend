import { ApiProperty } from '@nestjs/swagger';

export class UpdateStudentReservedResponseDto {
  @ApiProperty({ description: 'Reservado com Sucesso?', example: true })
  success: boolean;
}
