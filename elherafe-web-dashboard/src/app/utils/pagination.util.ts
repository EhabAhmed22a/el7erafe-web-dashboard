export interface PaginatedPayload<T> {
  items: T[];
  totalItems: number;
  hasExactTotal: boolean;
  totalPages?: number | null;
  hasNextHint?: boolean | null;
}

export interface PaginationState {
  totalItems: number;
  hasExactTotal: boolean;
  hasNextPage: boolean;
}

const ARRAY_KEYS = ['data', 'items', 'results', 'records', 'services'];
const TOTAL_KEYS = ['totalItems', 'totalCount', 'total', 'count'];
const TOTAL_PAGES_KEYS = ['totalPages', 'pageCount', 'pages'];
const HAS_NEXT_KEYS = ['hasNext', 'hasNextPage', 'hasMore'];

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
}

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
  }
  return null;
}

/**
 * Normalizes backend pagination responses that may use different property names.
 */
export function extractPaginatedPayload<T>(response: any, extraArrayKeys: string[] = []): PaginatedPayload<T> {
  if (!response) {
    return { items: [], totalItems: 0, hasExactTotal: false };
  }

  const allArrayKeys = [...extraArrayKeys, ...ARRAY_KEYS];
  let items: T[] = [];

  if (Array.isArray(response)) {
    items = response;
  } else {
    for (const key of allArrayKeys) {
      const candidate = response[key];
      if (Array.isArray(candidate)) {
        items = candidate;
        break;
      }
    }
  }

  const totalCandidates = [
    ...TOTAL_KEYS.map((key) => response?.[key]),
    response?.pagination?.totalItems,
    response?.pagination?.totalCount,
    response?.pagination?.total,
    response?.pagination?.count,
    response?.meta?.totalItems,
    response?.meta?.totalCount,
    response?.meta?.total
  ];

  const totalPagesCandidates = [
    ...TOTAL_PAGES_KEYS.map((key) => response?.[key]),
    response?.pagination?.totalPages,
    response?.pagination?.pageCount,
    response?.meta?.totalPages,
    response?.meta?.pageCount
  ];

  const hasNextCandidates = [
    ...HAS_NEXT_KEYS.map((key) => response?.[key]),
    response?.pagination?.hasNext,
    response?.pagination?.hasNextPage,
    response?.pagination?.hasMore,
    response?.meta?.hasNext,
    response?.meta?.hasNextPage,
    response?.links?.next ? true : null,
    response?.pagination?.nextPage ? true : null,
    response?.nextPage ? true : null
  ];

  const total = totalCandidates
    .map(coerceNumber)
    .find((value) => typeof value === 'number' && value >= 0);

  const totalPages = totalPagesCandidates
    .map(coerceNumber)
    .find((value) => typeof value === 'number' && value >= 0);

  const hasNextHint = hasNextCandidates
    .map(coerceBoolean)
    .find((value) => typeof value === 'boolean');

  return {
    items,
    totalItems: typeof total === 'number' ? total : items.length,
    hasExactTotal: typeof total === 'number',
    totalPages: typeof totalPages === 'number' ? totalPages : null,
    hasNextHint: typeof hasNextHint === 'boolean' ? hasNextHint : null
  };
}

export function buildPaginationState<T>(
  payload: PaginatedPayload<T>,
  pageNumber: number,
  pageSize: number
): PaginationState {
  const safePageSize = Math.max(pageSize, 1);
  const itemsSeen = (pageNumber - 1) * safePageSize + payload.items.length;

  const deriveHasNext = (approximate: boolean): boolean => {
    if (typeof payload.hasNextHint === 'boolean') {
      return payload.hasNextHint;
    }
    if (!approximate && payload.hasExactTotal) {
      const totalPages = payload.totalPages && payload.totalPages > 0
        ? payload.totalPages
        : Math.ceil(payload.totalItems / safePageSize);
      return pageNumber < Math.max(totalPages, 1);
    }
    return payload.items.length === safePageSize;
  };

  const inconsistentTotal = payload.hasExactTotal && payload.totalItems < itemsSeen;
  const suspiciousFirstPage =
    payload.hasExactTotal &&
    pageNumber === 1 &&
    payload.items.length === safePageSize &&
    payload.totalItems <= payload.items.length;

  if (payload.hasExactTotal && !inconsistentTotal && !suspiciousFirstPage) {
    return {
      totalItems: payload.totalItems,
      hasExactTotal: true,
      hasNextPage: deriveHasNext(false)
    };
  }

  return {
    totalItems: itemsSeen,
    hasExactTotal: false,
    hasNextPage: deriveHasNext(true)
  };
}
