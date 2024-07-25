import { ApiProperty } from '@nestjs/swagger';
import { CreateUserRequestDto } from './request/create-user-request.dto';

export class AddUsersDto {
  @ApiProperty({ description: 'Linha do registro', example: 3 })
  line: number;

  @ApiProperty({ description: 'Dados do usuário' })
  userData: CreateUserRequestDto;
}
