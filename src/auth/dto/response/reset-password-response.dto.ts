import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Token de redefinição de senha',
    example: 'jwt-token-email',
  })
  token: string;
}
