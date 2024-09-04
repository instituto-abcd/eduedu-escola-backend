import { ApiProperty } from '@nestjs/swagger';

export class ReservedStudentRequestDto {
  @ApiProperty({ description: 'Usuário reservado?' })
  reserved: boolean;
}
