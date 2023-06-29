import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordRequestDto {
  @ApiProperty({ description: 'Senha do Usuário', example: 'password123' })
  oldPassword: string;

  @ApiProperty({ description: 'Nova senha', example: '456password' })
  newPassword: string;
}
