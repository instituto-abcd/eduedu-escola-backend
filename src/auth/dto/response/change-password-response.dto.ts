import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordResponseDto {
  @ApiProperty({ description: 'Senha alterada com sucesso' })
  success: boolean;
}
