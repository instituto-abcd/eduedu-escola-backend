import { Profile } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequestDto {
  @ApiProperty({ description: 'Nome do Usuário' })
  name: string;

  @ApiProperty({ description: 'Senha do Usuário' })
  password: string;

  @ApiProperty({ description: 'Email do Usuário' })
  email: string;

  @ApiProperty({ description: 'CPF do Usuário' })
  document: string;

  @ApiProperty({ description: 'Perfil do Usuário' })
  profile: Profile;
}
