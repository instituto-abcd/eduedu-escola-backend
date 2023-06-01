import { ApiProperty } from '@nestjs/swagger';

export class PaginationInfo {
  @ApiProperty({ description: 'Quantidade total de itens retornados' })
  totalItems: number;

  @ApiProperty({ description: 'Quantidade de itens da página' })
  pageSize: number;

  @ApiProperty({ description: 'Número da página' })
  pageNumber: number;

  @ApiProperty({ description: 'Quantidade total de páginas da consulta' })
  totalPages: number;

  @ApiProperty({ description: 'Número da página anterior à atual' })
  previousPage: number;

  @ApiProperty({ description: 'Número da página seguinte à atual' })
  nextPage: number;

  @ApiProperty({ description: 'Última página da consulta' })
  lastPage: number;

  @ApiProperty({ description: 'Indicador se há página anterior' })
  hasPreviousPage: boolean;

  @ApiProperty({ description: 'Indicador se há página seguinte' })
  hasNextPage: boolean;
}
