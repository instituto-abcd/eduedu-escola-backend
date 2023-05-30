// create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome completo', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'E-mail', example: 'johndoe@example.com' })
  email: string;

  @ApiProperty({ description: 'CPF', example: '12345678901' })
  document: string;

  @ApiProperty({ description: 'Perfil do usuário', example: 'student' })
  profile: string;

  @ApiProperty({
    description: 'ID da escola',
    example: '1234567890',
    required: false,
  })
  schoolId?: string;
}
