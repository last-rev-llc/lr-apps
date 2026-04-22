import { describe, it, expect, beforeEach } from "vitest";
import {
  _resetRateLimitStore,
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from "../rate-limit";

beforeEach(() => {
  _resetRateLimitStore();
});

describe("rateLimit", () => {
  it("allows up to the limit and then blocks", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const r = rateLimit("k", 5, 60_000, now);
      expect(r.allowed).toBe(true);
      expect(r.limit).toBe(5);
      expect(r.remaining).toBe(4 - i);
    }
    const blocked = rateLimit("k", 5, 60_000, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.reset).toBe(now + 60_000);
  });

  it("resets the window after expiry", () => {
    const t0 = 1_000_000;
    rateLimit("k", 2, 60_000, t0);
    rateLimit("k", 2, 60_000, t0);
    expect(rateLimit("k", 2, 60_000, t0).allowed).toBe(false);

    const t1 = t0 + 60_001;
    const result = rateLimit("k", 2, 60_000, t1);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
    expect(result.reset).toBe(t1 + 60_000);
  });

  it("tracks different keys independently", () => {
    const now = 1_000_000;
    rateLimit("a", 1, 60_000, now);
    const blockedA = rateLimit("a", 1, 60_000, now);
    const freshB = rateLimit("b", 1, 60_000, now);
    expect(blockedA.allowed).toBe(false);
    expect(freshB.allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("prefers the first entry in x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(h)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(getClientIp(h)).toBe("9.9.9.9");
  });

  it("returns unknown when neither header present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 with X-RateLimit-* and Retry-After headers", async () => {
    const now = Date.now();
    const response = rateLimitResponse({
      allowed: false,
      limit: 10,
      remaining: 0,
      reset: now + 30_000,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("X-RateLimit-Reset")).toBe(
      String(Math.ceil((now + 30_000) / 1000)),
    );
    const retryAfter = Number(response.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThanOrEqual(29);
    expect(retryAfter).toBeLessThanOrEqual(30);

    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("rate_limited");
  });
});
