import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '4d63086b-5b83-418b-bb28-761e5accb978',
  })
  id: string;

  @ApiProperty({ description: 'Nome do usuário', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'johndoe@example.com',
  })
  email: string;

  @ApiProperty({ description: 'Documento do usuário', example: '1234567890' })
  document: string;

  @ApiProperty({ description: 'Token de acesso', example: 'EDUEDU001' })
  accessToken: string;

  @ApiProperty({ description: 'Nome da Escola', example: 'Escola Pública' })
  schoolName: string;

  constructor(
    id: string,
    name: string,
    email: string,
    document: string,
    accessToken: string,
    schoolName: string,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.document = document;
    this.accessToken = accessToken;
    this.schoolName = schoolName;
  }
}
