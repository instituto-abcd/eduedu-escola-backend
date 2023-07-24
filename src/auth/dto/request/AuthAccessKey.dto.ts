import { ApiProperty } from '@nestjs/swagger';

export class AuthAccessKeyDto {
  @ApiProperty({
    type: String,
    description: 'Chave de acesso',
    example: 'GOLFINHO0695',
  })
  accessKey: string;
}
