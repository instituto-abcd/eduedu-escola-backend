import { ApiProperty } from '@nestjs/swagger';

export class AuthRequestDto {
  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'contato@eduedu.com.br',
  })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'edu312r' })
  password: string;
}
