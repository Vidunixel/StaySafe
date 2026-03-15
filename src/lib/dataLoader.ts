import { supabase } from "./supabase";

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const CACHE_PREFIX = "staysafe.cache.v1";

type CacheEnvelope<T> = {
  expiresAt: number;
  data: T;
};

function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}.${key}`;
}

export function getDefaultCacheTtlMs(): number {
  return DAY_MS;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getCacheKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.expiresAt !== "number") return null;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(getCacheKey(key));
      return null;
    }

    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T, ttlMs: number): void {
  try {
    const payload: CacheEnvelope<T> = {
      expiresAt: Date.now() + ttlMs,
      data,
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(payload));
  } catch {
    // Ignore storage failures (quota, privacy mode, etc).
  }
}

export async function loadWithCache<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DAY_MS,
): Promise<T> {
  const cached = readCache<T>(key);
  if (cached !== null) return cached;

  const fresh = await loader();
  writeCache(key, fresh, ttlMs);
  return fresh;
}

export async function fetchAllRows<T>(
  table: string,
  columns: string,
  pageSize: number = PAGE_SIZE,
): Promise<T[]> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, to);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as T[];
    allRows.push(...batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}
