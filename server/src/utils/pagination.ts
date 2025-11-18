export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
}

export interface PaginationParams {
  limit?: unknown;
  offset?: unknown;
}

export function parsePagination(
  { limit, offset }: PaginationParams,
  defaults = { limit: 20, maxLimit: 100 },
): { limit: number; offset: number } {
  let l = Number(limit ?? defaults.limit);
  if (!Number.isFinite(l) || l <= 0 || l > defaults.maxLimit) l = defaults.limit;

  let o = Number(offset ?? 0);
  if (!Number.isFinite(o) || o < 0) o = 0;

  return { limit: l, offset: o };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number,
): PaginatedResult<T> {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { items, total, limit, offset, page, totalPages };
}
