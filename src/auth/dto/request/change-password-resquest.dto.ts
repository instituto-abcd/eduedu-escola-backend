import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Token de redefinição de senha',
    example: 'jwt-token-password',
  })
  token: string;

  @ApiProperty({ description: 'Nova senha', example: '123qwe' })
  password: string;

  @ApiProperty({ description: 'Confirmação da nova senha', example: '123qwe' })
  passwordConfirmation: string;
}
