import { Profile, Status } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'Identificador do Usuário' })
  id: string;

  @ApiProperty({ description: 'Nome do Usuário' })
  name: string;
  @ApiProperty({ description: 'Email do Usuário' })
  email: string;

  @ApiProperty({ description: 'CPF do Usuário' })
  document: string;

  @ApiProperty({ description: 'Perfil do Usuário' })
  profile: Profile;

  @ApiProperty({ description: 'Status do Usuário' })
  status: string;
}
