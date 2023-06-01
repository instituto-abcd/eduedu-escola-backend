import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserResponseDto {
  @ApiProperty({ description: 'Exclusão com Sucesso?' })
  success: boolean;
}
