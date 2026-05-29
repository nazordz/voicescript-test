export type SortDirection = "asc" | "desc";

export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function getPagination(page: number, pageSize: number, totalItems: number) {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  } satisfies Pagination;
}

export function getOrderBy(
  sortBy: string | undefined,
  sortDir: SortDirection,
  allowedSorts: readonly string[],
  fallback: string,
) {
  const key = sortBy && allowedSorts.includes(sortBy) ? sortBy : fallback;
  return { [key]: sortDir } as Record<string, SortDirection>;
}
