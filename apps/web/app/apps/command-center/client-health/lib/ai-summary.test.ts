import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_USER_ID = "user-test-1";

const requireAccessMock = vi.fn();
vi.mock("@repo/auth/server", () => ({
  requireAccess: (...args: unknown[]) => requireAccessMock(...args),
}));

const enforceFeatureTierMock = vi.fn();
vi.mock("@/lib/enforce-feature-tier", () => ({
  enforceFeatureTier: (...args: unknown[]) => enforceFeatureTierMock(...args),
}));

const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
vi.mock("@repo/db/cache", () => ({
  cacheGet: (...args: unknown[]) => cacheGetMock(...args),
  cacheSet: (...args: unknown[]) => cacheSetMock(...args),
}));

let siteRows: Array<Record<string, unknown>> = [];
let dbError: { message: string } | null = null;

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table !== "client_sites") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        select: () => ({
          eq: async (_col: string, _val: unknown) =>
            dbError
              ? { data: null, error: dbError }
              : { data: siteRows, error: null },
        }),
      };
    }),
  })),
}));

const summarizeMock = vi.fn();
vi.mock("./ai-summary", async () => {
  const actual = await vi.importActual<typeof import("./ai-summary")>(
    "./ai-summary",
  );
  return {
    ...actual,
    summarize: (...args: Parameters<typeof actual.summarize>) =>
      summarizeMock(...args),
  };
});

import { summarizeClientHealth } from "./actions";
import { _resetRateLimitStore } from "@/lib/rate-limit";
import { SUMMARY_MODEL_ID } from "./ai-summary";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  siteRows = [
    {
      client_id: "c-1",
      client_name: "Acme",
      url: "https://acme.example/a",
      status: "up",
      score: 95,
      responseTime: 220,
      uptime: 99.9,
      ssl_expiry: "2026-12-01T00:00:00.000Z",
    },
  ];
  dbError = null;
  requireAccessMock.mockResolvedValue({
    user: { id: TEST_USER_ID, email: "user@example.com" },
    permission: "view",
  });
  enforceFeatureTierMock.mockResolvedValue(true);
  cacheGetMock.mockResolvedValue(null);
  cacheSetMock.mockResolvedValue(undefined);
  summarizeMock.mockResolvedValue({
    headline: "Acme is steady",
    positives: ["all sites up"],
    concerns: [],
    recommendations: ["keep monitoring"],
  });
  _resetRateLimitStore();
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("summarizeClientHealth", () => {
  it("returns a fresh summary for a pro user and caches it", async () => {
    const result = await summarizeClientHealth("c-1");
    expect(result).toMatchObject({
      ok: true,
      cached: false,
      model: SUMMARY_MODEL_ID,
    });
    if (result.ok) {
      expect(result.summary.headline).toBe("Acme is steady");
    }
    expect(summarizeMock).toHaveBeenCalledOnce();
    expect(cacheSetMock).toHaveBeenCalledOnce();
    const [key, payload, ttl] = cacheSetMock.mock.calls[0]!;
    expect(key).toBe("client-health:summary:c-1");
    expect((payload as { model: string }).model).toBe(SUMMARY_MODEL_ID);
    expect(ttl).toBe(60 * 60);
  });

  it("denies free users with a typed feature_locked result", async () => {
    enforceFeatureTierMock.mockResolvedValueOnce(false);
    const result = await summarizeClientHealth("c-1");
    expect(result).toEqual({
      ok: false,
      error: "feature_locked",
      requiredTier: "pro",
    });
    expect(summarizeMock).not.toHaveBeenCalled();
  });

  it("returns the cached payload without calling the model on a cache hit", async () => {
    cacheGetMock.mockResolvedValueOnce({
      summary: {
        headline: "Cached headline",
        positives: ["cached p"],
        concerns: [],
        recommendations: ["cached r"],
      },
      cachedAt: "2026-04-30T00:00:00.000Z",
      model: SUMMARY_MODEL_ID,
    });
    const result = await summarizeClientHealth("c-1");
    expect(result).toMatchObject({
      ok: true,
      cached: true,
      cachedAt: "2026-04-30T00:00:00.000Z",
    });
    expect(summarizeMock).not.toHaveBeenCalled();
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it("rate-limits to 20 calls/hour/user — 21st returns rate_limited without calling the model", async () => {
    for (let i = 0; i < 20; i++) {
      const r = await summarizeClientHealth("c-1");
      expect(r.ok).toBe(true);
    }
    expect(summarizeMock).toHaveBeenCalledTimes(20);
    summarizeMock.mockClear();
    const blocked = await summarizeClientHealth("c-1");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error).toBe("rate_limited");
      if (blocked.error === "rate_limited") {
        expect(typeof blocked.resetAt).toBe("number");
      }
    }
    expect(summarizeMock).not.toHaveBeenCalled();
  });

  it("falls back to the deterministic stub when ANTHROPIC_API_KEY is unset", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    summarizeMock.mockReset();
    summarizeMock.mockImplementation(async (...args: unknown[]) => {
      const actual = await vi.importActual<typeof import("./ai-summary")>(
        "./ai-summary",
      );
      return actual.summarize(
        ...(args as Parameters<typeof actual.summarize>),
      );
    });
    const result = await summarizeClientHealth("c-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.summary.headline).toBe("string");
      expect(result.summary.headline.length).toBeGreaterThan(0);
      expect(Array.isArray(result.summary.positives)).toBe(true);
      expect(Array.isArray(result.summary.recommendations)).toBe(true);
    }
  });

  it("returns invalid_input for an empty clientId", async () => {
    const result = await summarizeClientHealth("");
    expect(result).toEqual({ ok: false, error: "invalid_input" });
    expect(summarizeMock).not.toHaveBeenCalled();
  });

  it("returns client_not_found when no sites match", async () => {
    siteRows = [];
    const result = await summarizeClientHealth("c-1");
    expect(result).toEqual({ ok: false, error: "client_not_found" });
    expect(summarizeMock).not.toHaveBeenCalled();
  });
});
