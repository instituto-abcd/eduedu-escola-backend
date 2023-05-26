import { ApiProperty } from '@nestjs/swagger';
import { PaginationInfo } from './pagination-info.dto';

export class PaginationResponse<T> {
  @ApiProperty({ type: [Object] })
  items: T[];

  @ApiProperty()
  pagination: PaginationInfo;

  constructor(items: T[], pagination: PaginationInfo) {
    this.items = items;
    this.pagination = pagination;
  }
}
