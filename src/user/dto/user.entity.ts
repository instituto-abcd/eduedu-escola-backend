import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '@prisma/client';

export class User {
  @ApiProperty({ description: 'Identificador' })
  id: string;

  @ApiProperty({ description: 'Nome completo' })
  name: string;

  @ApiProperty({ description: 'E-mail' })
  email: string;

  @ApiProperty({ description: 'CPF' })
  document: string;

  @ApiProperty({ description: 'Perfil do usuário' })
  profile: Profile;

  @ApiProperty({ description: 'Identificador da Escola' })
  schoolId: string;
}
