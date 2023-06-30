import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ example: 'EduEdu Escola', required: false })
  schoolName?: string;

  @ApiProperty({ example: true, required: false })
  synchronizationPlanets?: boolean;

  @ApiProperty({ example: 'smtp.example.com', required: false })
  smtpHostName?: string;

  @ApiProperty({ example: 'username', required: false })
  smtpUserName?: string;

  @ApiProperty({ example: 'password', required: false })
  smtpPassword?: string;

  @ApiProperty({ example: true, required: false })
  sslIsActive?: boolean;
}
