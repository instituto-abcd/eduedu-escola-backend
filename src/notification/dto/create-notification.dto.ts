import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Texto da notificação',
    example: 'Novos planetas foram sincronizados.',
  })
  readonly text: string;

  @ApiProperty({
    description: 'Perfis que receberão a notificação',
    example: ['DIRECTOR', 'PROFESSOR'],
  })
  readonly profiles: Profile[];
}
