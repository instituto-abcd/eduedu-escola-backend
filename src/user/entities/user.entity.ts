import { ApiProperty } from '@nestjs/swagger';

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
  profile: string;
}
