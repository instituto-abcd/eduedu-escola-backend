import { ApiProperty } from '@nestjs/swagger';

export class UserAccessCodeResponseDto {
  @ApiProperty({ description: 'Código de Acesso', example: '1234' })
  accessKey: string;
}
