import { ApiProperty } from '@nestjs/swagger';

export class StudentExamDto {
  @ApiProperty({ description: 'ID da Execução da Prova', example: '64e4b113bded4e0a25a2736f' })
  id: string;

  @ApiProperty({
    description: 'Data da prova',
    example: '2023-01-01T15:30:00.000Z',
  })
  examDate: Date;
}
