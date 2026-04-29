// Thin cache facade over Upstash Redis. Returns null when env vars are
// absent so local dev falls back to direct Supabase reads.
//
// Keys (stable schema — DO NOT reshape without a migration plan):
//   perm:{userId}:{slug}          ttl 60s
//   sub:{userId}                  ttl 300s
//   app:sub:{subdomain}           indefinite, keyed by VERSION
//   app:slug:{slug}               indefinite, keyed by VERSION
import { Redis } from "@upstash/redis";

let _client: Redis | null | undefined = undefined;

/** Build-time constant so each deploy invalidates the indefinite app:* keys. */
export const CACHE_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.CACHE_VERSION ?? "local";

export const PERM_TTL_SECONDS = 60;
export const SUB_TTL_SECONDS = 300;

export function getCache(): Redis | null {
  if (_client !== undefined) return _client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _client = null;
    return null;
  }
  _client = new Redis({ url, token });
  return _client;
}

/** Reset the cached client. For tests only. */
export function resetCacheClient(): void {
  _client = undefined;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getCache();
  if (!client) return null;
  try {
    return (await client.get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<void> {
  const client = getCache();
  if (!client) return;
  try {
    if (ttlSeconds) {
      await client.set(key, value, { ex: ttlSeconds });
    } else {
      await client.set(key, value);
    }
  } catch {
    // Cache writes are best-effort — never block the caller.
  }
}

export async function cacheDel(keys: string[]): Promise<void> {
  const client = getCache();
  if (!client || keys.length === 0) return;
  try {
    await client.del(...keys);
  } catch {
    // ignore
  }
}

export const cacheKeys = {
  permission: (userId: string, slug: string) => `perm:${userId}:${slug}`,
  subscription: (userId: string) => `sub:${userId}`,
  appBySubdomain: (subdomain: string) => `app:${CACHE_VERSION}:sub:${subdomain}`,
  appBySlug: (slug: string) => `app:${CACHE_VERSION}:slug:${slug}`,
};
