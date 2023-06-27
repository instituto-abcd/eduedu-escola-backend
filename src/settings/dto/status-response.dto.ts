import { ApiProperty } from '@nestjs/swagger';

export class StatusResponseDto {
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica se o setup passou pela etapa final',
  })
  completedSchoolSetup: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description:
      'Indica se o setup passou pela etapa de cadastro de usuário master',
  })
  completedOwnerSetup: boolean;
}
