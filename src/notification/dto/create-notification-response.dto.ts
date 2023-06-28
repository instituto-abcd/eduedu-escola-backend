import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '@prisma/client';

export class CreateNotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty({
    enum: [Profile.DIRECTOR, Profile.TEACHER],
    example: [Profile.TEACHER],
  })
  profiles: Profile[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
