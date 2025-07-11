import { ApiProperty } from '@nestjs/swagger';
import { PaginationInfo } from './pagination-info-response.dto';

export class PaginationResponse<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ type: PaginationInfo })
  pagination: PaginationInfo;

  constructor(items: T[], pagination: PaginationInfo) {
    this.items = items;
    this.pagination = pagination;
  }
}
