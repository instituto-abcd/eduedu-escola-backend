import { Profile } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserAccessCodeResponseDto {
  @ApiProperty({ description: 'Código de Acesso', example: 'abcd1234' })
  accessKey: string;
}
