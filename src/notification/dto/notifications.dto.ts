import { ApiProperty } from '@nestjs/swagger';
import { Notification, Profile } from '@prisma/client';

export class NotificationDto {
  @ApiProperty({ description: 'Id do usuário' })
  userId: string;

  @ApiProperty({ description: 'Id da notificação' })
  notificationId: string;

  @ApiProperty({ description: 'Notificação lida' })
  read: boolean;

  @ApiProperty({
    description: 'Metadados da notificação',
    properties: {
      id: { type: 'string' },
      text: { type: 'string' },
      profiles: {
        type: 'array',
        items: { type: 'string', enum: [Profile.DIRECTOR, Profile.TEACHER] },
        example: [Profile.DIRECTOR],
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  })
  notification: Notification;
}
