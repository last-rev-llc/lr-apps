import { NextResponse } from "next/server";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number): void {
  if (buckets.size < 1024) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  pruneExpired(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      reset: fresh.resetAt,
      limit,
    };
  }

  existing.count += 1;
  const remaining = Math.max(limit - existing.count, 0);
  return {
    allowed: existing.count <= limit,
    remaining,
    reset: existing.resetAt,
    limit,
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
}

function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  now: number = Date.now(),
): void {
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", String(Math.ceil(result.reset / 1000)));
  if (!result.allowed) {
    const retryAfter = Math.max(Math.ceil((result.reset - now) / 1000), 0);
    headers.set("Retry-After", String(retryAfter));
  }
}

export function applyRateLimitHeaders<T extends Response | NextResponse>(
  response: T,
  result: RateLimitResult,
): T {
  setRateLimitHeaders(response.headers, result);
  return response;
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const response = Response.json(
    { error: "rate_limited", message: "Too many requests" },
    { status: 429 },
  );
  setRateLimitHeaders(response.headers, result);
  return response;
}

export function rateLimitNextResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    { error: "rate_limited", message: "Too many requests" },
    { status: 429 },
  );
  setRateLimitHeaders(response.headers, result);
  return response;
}

/** @internal — testing only */
export function _resetRateLimitStore(): void {
  buckets.clear();
}
