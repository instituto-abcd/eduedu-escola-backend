import { ApiProperty } from '@nestjs/swagger';

export class InativeUserRequestDto {
  @ApiProperty({
    description: 'IDs dos Usuários',
    example: [
      '4d63086b-5b83-418b-bb28-761e5accb978',
      'e57136f7-9df1-4644-b9a7-bfddfd799c77',
      '274f258c-cf3b-4bbc-b0cf-48a12f95657f',
    ],
  })
  ids: string[];
}
