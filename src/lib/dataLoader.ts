import { fetchTable } from "./api";

const DAY_MS = 24 * 60 * 60 * 1000;
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

// `columns` is only documentation now: the local server returns whole rows,
// which are the columns the old Supabase select() asked for.
export async function fetchAllRows<T>(
  table: string,
  _columns?: string,
): Promise<T[]> {
  return fetchTable<T>(table);
}
