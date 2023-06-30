import { ApiProperty } from '@nestjs/swagger';

export class InativeUserResponseDto {
  @ApiProperty({
    description: 'Estudantes desativados com sucesso?',
    example: true,
  })
  success: boolean;
}
