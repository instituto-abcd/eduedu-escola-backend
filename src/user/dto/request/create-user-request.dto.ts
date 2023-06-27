import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '@prisma/client';

export class CreateUserRequestDto {
  @ApiProperty({ description: 'Nome do Usuário', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Senha do Usuário', example: 'password123' })
  password: string;

  @ApiProperty({
    description: 'Email do Usuário',
    example: 'johndoe@example.com',
  })
  email: string;

  @ApiProperty({ description: 'CPF do Usuário', example: '12345678900' })
  document: string;

  @ApiProperty({ description: 'Perfil do Usuário', example: 'TEACHER' })
  profile: Profile;
}
