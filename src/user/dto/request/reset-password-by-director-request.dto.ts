import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordByDirectorRequestDto {
  @ApiProperty({ description: 'Nova senha do professor', example: 'Senha7x' })
  newPassword: string;
}
