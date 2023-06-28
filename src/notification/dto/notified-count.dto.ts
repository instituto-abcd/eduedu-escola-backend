import { ApiProperty } from '@nestjs/swagger';

export class NotifiedCountDto {
  @ApiProperty({
    type: Number,
    description: 'Quanditdade de usuários notificados',
  })
  notifiedUsers: number;
}
