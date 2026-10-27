const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export type Pagination = { page: number; pageSize: number; from: number; to: number };

/**
 * Reads ?page=&page_size= from a query string. Returns null when `page` is absent so
 * callers that don't paginate keep getting the full list.
 */
export function parsePagination(query: Record<string, unknown>): Pagination | null {
  if (query.page === undefined) return null;
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const requestedSize = Math.floor(Number(query.page_size)) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize));
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize - 1 };
}

export function paginationMeta(pagination: Pagination, total: number) {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
    total,
    total_pages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}

/** Comma-separated list from a query param, trimmed and capped so it can't fan out unbounded queries. */
export function parseList(value: unknown, max = 10): string[] {
  if (!value) return [];
  return String(value).split(',').map((s) => s.trim()).filter(Boolean).slice(0, max);
}

/** PostgREST caps responses at 1000 rows, so page through them. `build` must return a FRESH query with a stable order. */
export async function fetchAllRows<T = any>(build: () => any, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}
