import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AppPermission, SubscriptionRow } from "../types";

const ORIGINAL_ENV = { ...process.env };

interface FakeStoreEntry {
  value: unknown;
  expiresAt: number | null;
}

class FakeRedis {
  store = new Map<string, FakeStoreEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(
    key: string,
    value: unknown,
    opts?: { ex?: number },
  ): Promise<"OK"> {
    this.store.set(key, {
      value,
      expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null,
    });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) deleted++;
    }
    return deleted;
  }
}

let fakeRedis: FakeRedis;
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => fakeRedis),
}));

function mockClient(result: { data: unknown; error: unknown }) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain as unknown as SupabaseClient<Database>;
}

beforeEach(async () => {
  process.env = { ...ORIGINAL_ENV };
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
  fakeRedis = new FakeRedis();
  const { resetCacheClient } = await import("../cache");
  resetCacheClient();
  vi.clearAllMocks();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("cache env gating", () => {
  it("getCache returns null when env vars are absent", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { getCache, resetCacheClient } = await import("../cache");
    resetCacheClient();
    expect(getCache()).toBeNull();
  });

  it("getCache returns a Redis client when both env vars are set", async () => {
    const { getCache } = await import("../cache");
    expect(getCache()).not.toBeNull();
  });
});

describe("getAppPermission (cached)", () => {
  it("cache miss: queries Supabase, caches the result", async () => {
    const client = mockClient({ data: { permission: "edit" }, error: null });
    const { getAppPermission } = await import("../queries");

    const result = await getAppPermission(client, "u1", "my-app");
    expect(result).toBe("edit");
    expect(client.from).toHaveBeenCalledWith("app_permissions");
    expect(fakeRedis.store.has("perm:u1:my-app")).toBe(true);
  });

  it("cache hit: returns cached value without calling Supabase", async () => {
    fakeRedis.store.set("perm:u1:my-app", {
      value: { permission: "admin" },
      expiresAt: Date.now() + 60_000,
    });

    const client = mockClient({ data: null, error: null });
    const { getAppPermission } = await import("../queries");

    const result = await getAppPermission(client, "u1", "my-app");
    expect(result).toBe("admin");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("caches null-permission lookups to avoid thrashing", async () => {
    const client = mockClient({ data: null, error: null });
    const { getAppPermission } = await import("../queries");

    const result = await getAppPermission(client, "u1", "unknown");
    expect(result).toBeNull();
    expect(fakeRedis.store.has("perm:u1:unknown")).toBe(true);
  });

  it("falls through to Supabase when cache env vars are absent", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    const { resetCacheClient } = await import("../cache");
    resetCacheClient();

    const client = mockClient({ data: { permission: "view" }, error: null });
    const { getAppPermission } = await import("../queries");
    const result = await getAppPermission(client, "u1", "app");

    expect(result).toBe("view");
    expect(client.from).toHaveBeenCalledWith("app_permissions");
  });
});

describe("getUserSubscription (cached)", () => {
  const mockSub: SubscriptionRow = {
    id: "sub-1",
    user_id: "u1",
    stripe_customer_id: "cus_123",
    stripe_subscription_id: "sub_123",
    status: "active",
    tier: "pro",
    current_period_start: "2026-01-01T00:00:00Z",
    current_period_end: "2026-02-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("cache miss: queries then caches", async () => {
    const client = mockClient({ data: mockSub, error: null });
    const { getUserSubscription } = await import("../queries");

    const result = await getUserSubscription(client, "u1");
    expect(result).toEqual(mockSub);
    expect(fakeRedis.store.has("sub:u1")).toBe(true);
  });

  it("cache hit: returns cached value", async () => {
    fakeRedis.store.set("sub:u1", {
      value: { subscription: mockSub },
      expiresAt: Date.now() + 300_000,
    });

    const client = mockClient({ data: null, error: null });
    const { getUserSubscription } = await import("../queries");

    const result = await getUserSubscription(client, "u1");
    expect(result).toEqual(mockSub);
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("upsertPermission invalidation", () => {
  it("deletes the cached permission after upsert", async () => {
    fakeRedis.store.set("perm:u1:my-app", {
      value: { permission: "view" },
      expiresAt: Date.now() + 60_000,
    });

    const mockRow: AppPermission = {
      id: "p1",
      user_id: "u1",
      app_slug: "my-app",
      permission: "admin",
      created_at: "2026-01-01T00:00:00Z",
    };
    const client = mockClient({ data: mockRow, error: null });
    const { upsertPermission } = await import("../queries");

    await upsertPermission(client, "u1", "my-app", "admin");
    expect(fakeRedis.store.has("perm:u1:my-app")).toBe(false);
  });
});

describe("cache helpers", () => {
  it("cacheDel handles no-cache case gracefully", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    const { resetCacheClient, cacheDel } = await import("../cache");
    resetCacheClient();
    await expect(cacheDel(["any-key"])).resolves.toBeUndefined();
  });

  it("cacheDel handles empty keys array", async () => {
    const { cacheDel } = await import("../cache");
    await expect(cacheDel([])).resolves.toBeUndefined();
  });

  it("cacheKeys builds stable key shapes", async () => {
    const { cacheKeys } = await import("../cache");
    expect(cacheKeys.permission("u1", "app")).toBe("perm:u1:app");
    expect(cacheKeys.subscription("u1")).toBe("sub:u1");
    expect(cacheKeys.appBySubdomain("x")).toMatch(/^app:.*:sub:x$/);
    expect(cacheKeys.appBySlug("y")).toMatch(/^app:.*:slug:y$/);
  });
});
