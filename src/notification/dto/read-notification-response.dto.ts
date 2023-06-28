import { ApiProperty } from '@nestjs/swagger';

export class ReadNotificationResponseDto {
  @ApiProperty({ description: 'Número de notificações lidas', example: 2 })
  notificationCount: number;
}
