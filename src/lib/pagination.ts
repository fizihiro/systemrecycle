export const PAGE_SIZE = 10;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export function resolvePage(page?: string | number | null): number {
  const parsed = typeof page === "string" ? Number(page) : (page ?? 1);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize = PAGE_SIZE,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page: Math.min(resolvePage(page), totalPages),
    pageSize,
    total,
    totalPages,
  };
}

export function getSkip(page: number, pageSize = PAGE_SIZE): number {
  return (page - 1) * pageSize;
}

export function paginated<T>(
  items: T[],
  pagination: PaginationMeta,
): PaginatedResult<T> {
  return { items, pagination };
}
