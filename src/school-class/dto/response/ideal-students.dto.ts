import { ApiProperty } from '@nestjs/swagger';

export class IdealStudentsDto {
  @ApiProperty({ type: String, example: 'guid' })
  studentId: string;

  @ApiProperty({ type: String, example: 'Amanda' })
  name: string;

  @ApiProperty({ type: String, example: '2023-08-25T13:34:05.719Z' })
  lastExamDate: Date;
}
