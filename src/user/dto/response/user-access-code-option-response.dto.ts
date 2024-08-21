import { ApiProperty } from '@nestjs/swagger';

export class UserAccessCodeOptionResponseDto {
  @ApiProperty({ description: 'Código de Acesso', example: '1234' })
  accessKey: string;

  @ApiProperty({ description: 'Alternativa Correta', example: false })
  correctAnswer: boolean;
}
