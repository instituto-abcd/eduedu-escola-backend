import { ApiProperty } from '@nestjs/swagger';

export class InativeUserResponseDto {
  @ApiProperty({
    description: 'Usuários desativados com sucesso?',
    example: true,
  })
  success: boolean;
}
