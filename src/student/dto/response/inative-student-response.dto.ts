import { ApiProperty } from '@nestjs/swagger';

export class InativeStudentResponseDto {
  @ApiProperty({
    description: 'Usuários desativados com sucesso?',
    example: true,
  })
  success: boolean;
}
