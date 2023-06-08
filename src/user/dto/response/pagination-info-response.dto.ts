import { ApiProperty } from '@nestjs/swagger';

export class PaginationInfo {
  @ApiProperty({
    description: 'Quantidade total de itens retornados',
    example: 100,
  })
  totalItems: number;

  @ApiProperty({ description: 'Quantidade de itens da página', example: 10 })
  pageSize: number;

  @ApiProperty({ description: 'Número da página', example: 1 })
  pageNumber: number;

  @ApiProperty({
    description: 'Quantidade total de páginas da consulta',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({ description: 'Número da página anterior à atual', example: 0 })
  previousPage: number;

  @ApiProperty({ description: 'Número da página seguinte à atual', example: 2 })
  nextPage: number;

  @ApiProperty({ description: 'Última página da consulta', example: 10 })
  lastPage: number;

  @ApiProperty({
    description: 'Indicador se há página anterior',
    example: false,
  })
  hasPreviousPage: boolean;

  @ApiProperty({
    description: 'Indicador se há página seguinte',
    example: true,
  })
  hasNextPage: boolean;
}
