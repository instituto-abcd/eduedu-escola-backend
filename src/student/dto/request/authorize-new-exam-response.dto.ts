import { ApiProperty } from '@nestjs/swagger';

export class AuthorizeNewExamResponseDto {
  @ApiProperty({
    description: 'Nova prova liberada para os Estudantes',
    example: true,
  })
  success: boolean;
}
