export class PaginationResponse<T> {
  constructor(
    public items: T[],
    public pagination: {
      totalItems: number;
      pageSize: number;
      pageNumber: number;
      totalPages: number;
      previousPage: number;
      nextPage: number;
      lastPage: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    },
  ) {}
}
