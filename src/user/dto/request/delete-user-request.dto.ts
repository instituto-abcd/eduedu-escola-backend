import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserRequestDto {
  @ApiProperty({ description: 'IDs dos Usuários' })
  ids: string[];
}
