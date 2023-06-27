import { Profile } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'Identificador do Usuário', example: '1a2b3c4d' })
  id: string;

  @ApiProperty({ description: 'Proprietário', example: true })
  owner: boolean;

  @ApiProperty({ description: 'Código de Acesso', example: 'abcd1234' })
  accessKey: string;

  @ApiProperty({ description: 'Nome do Usuário', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'Email do Usuário',
    example: 'johndoe@example.com',
  })
  email: string;

  @ApiProperty({ description: 'CPF do Usuário', example: '12345678900' })
  document: string;

  @ApiProperty({ description: 'Perfil do Usuário', example: 'TEACHER' })
  profile: Profile;

  @ApiProperty({ description: 'Status do Usuário', example: 'ACTIVE' })
  status: string;
}
