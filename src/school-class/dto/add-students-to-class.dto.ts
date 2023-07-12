import { ApiProperty } from '@nestjs/swagger';

export class AddStudentsToClassDto {
  @ApiProperty({
    description: 'ID da turma de origem (o id do destino é passado na rota)',
    example: '3a224fb1-ec95-456c-bf6f-ef877928b9b6',
    type: String,
  })
  originId: string;

  @ApiProperty({
    description: 'IDs dos estudantes',
    example: [
      '4d63086b-5b83-418b-bb28-761e5accb978',
      'e57136f7-9df1-4644-b9a7-bfddfd799c77',
      '274f258c-cf3b-4bbc-b0cf-48a12f95657f',
    ],
    type: [String],
  })
  studentIds: string[];
}
