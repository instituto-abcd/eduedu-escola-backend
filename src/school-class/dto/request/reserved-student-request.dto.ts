import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class ReservedStudentRequestDto {
  @ApiProperty({ description: 'Usuário reservado?' })
  reserved: boolean;
}
