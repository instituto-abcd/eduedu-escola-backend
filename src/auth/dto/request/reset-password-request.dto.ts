import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'contato@eduedu.com.br',
  })
  email: string;
}
