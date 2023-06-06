import { ApiProperty } from '@nestjs/swagger';

export class InativeUserRequestDto {
  @ApiProperty({ description: 'IDs dos Usuários' })
  ids: string[];
}
