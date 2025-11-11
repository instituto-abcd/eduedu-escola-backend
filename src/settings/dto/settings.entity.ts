import { ApiProperty } from '@nestjs/swagger';

export class Settings {
  @ApiProperty({ example: 'e57136f7-9df1-4644-b9a7-bfddfd799c77' })
  id: string;

  @ApiProperty({ example: 'EduEdu Escola', required: false })
  schoolName?: string;

  @ApiProperty({ example: true })
  synchronizationPlanets: boolean;

  @ApiProperty({ example: 'smtp.example.com' })
  smtpHostName: string;

  @ApiProperty({ example: 'username' })
  smtpUserName: string;

  @ApiProperty({ example: 'password' })
  smtpPassword: string;

  @ApiProperty({ example: '1234' })
  smtpPort: number;

  @ApiProperty({ example: true })
  sslIsActive: boolean;

  @ApiProperty({ example: 'e57136f7-9df1-4644-b9a7-bfddfd799c77' })
  schoolId: string;

  @ApiProperty({ example: '2023-06-07T14:23:40.740Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-06-07T14:23:40.740Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'HEEL-OWOR-LDDF-XXXX' })
  accessKey?: string;
}
