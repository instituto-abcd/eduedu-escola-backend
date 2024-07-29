import { ApiProperty } from '@nestjs/swagger';

export class AddUsersResponseDto {
  @ApiProperty({ description: 'Total de usuários criados', example: 10 })
  countCreated: number;

  @ApiProperty({
    description: 'Registros com erros',
    example: [{ line: 5, message: 'Necessário preencher todos os campos.' }],
  })
  errors: AddUsersResponseErrorDto[];
}

export class AddUsersResponseErrorDto {
  @ApiProperty({ description: 'Linha do registro', example: 5 })
  line: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Necessário preencher todos os campos.',
  })
  message: string;
}
