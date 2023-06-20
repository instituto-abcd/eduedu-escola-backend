import { ApiProperty } from '@nestjs/swagger';
import { Profile, Status } from '@prisma/client';

export class UpdateUserRequestDto {
  @ApiProperty({ description: 'Nome do Usuário', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'Email do Usuário',
    example: 'johndoe@example.com',
  })
  email: string;

  @ApiProperty({ description: 'CPF do Usuário', example: '123.456.789-00' })
  document: string;

  @ApiProperty({ description: 'Perfil do Usuário', example: 'TEACHER' })
  profile: Profile;

  @ApiProperty({ description: 'Status do Usuário', example: 'ACTIVE' })
  status: Status;
}
