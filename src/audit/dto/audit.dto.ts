import { ApiProperty } from '@nestjs/swagger';

export class AuditDto {
  @ApiProperty({ description: 'ID do registro' })
  id: string;

  @ApiProperty({ description: 'ID do usuário' })
  userId: string;

  @ApiProperty({ description: 'Ação tomada' })
  action: string;

  @ApiProperty({ description: 'Entitade afetada' })
  entity: string;

  @ApiProperty({ description: 'Data do registro' })
  createdAt: Date;
}
