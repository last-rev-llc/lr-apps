import { describe, it, expect, vi, beforeEach } from "vitest";

const { TEST_USER_ID, OTHER_USER_ID, VALID_UUID, INVALID_UUID } = vi.hoisted(
  () => ({
    TEST_USER_ID: "11111111-1111-4111-8111-111111111111",
    OTHER_USER_ID: "22222222-2222-4222-8222-222222222222",
    VALID_UUID: "33333333-3333-4333-8333-333333333333",
    INVALID_UUID: "not-a-uuid",
  }),
);

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn().mockResolvedValue({
    user: { id: TEST_USER_ID, email: "user@example.com" },
    permission: "view",
  }),
}));

const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
vi.mock("@repo/db/cache", () => ({
  CACHE_VERSION: "test-cache-version",
  cacheGet: (key: string) => cacheGetMock(key),
  cacheSet: (key: string, value: unknown, ttl?: number) =>
    cacheSetMock(key, value, ttl),
}));

const createSignedUrlMock = vi.fn();
vi.mock("@repo/storage", () => ({
  createSignedUrl: (...args: unknown[]) => createSignedUrlMock(...args),
}));

const withSpanMock = vi.fn(
  async <T,>(
    _name: string,
    _attributes: Record<string, unknown>,
    fn: () => Promise<T>,
  ) => fn(),
);

vi.mock("@/lib/otel", () => ({
  withSpan: <T,>(
    name: string,
    attributes: Record<string, unknown>,
    fn: () => Promise<T>,
  ) => withSpanMock(name, attributes, fn),
}));

interface Row extends Record<string, unknown> {
  id: string;
  user_id: string;
}

let templateStore: Row[] = [];
let memeStore: Row[] = [];

function makeQuery(table: "meme_templates" | "meme_creations") {
  const filters: Array<(r: Row) => boolean> = [];
  let order: { col: string; ascending: boolean } | null = null;
  const builder = {
    select: () => builder,
    eq(col: string, val: unknown) {
      filters.push((r) => r[col] === val);
      return builder;
    },
    order(col: string, opts?: { ascending: boolean }) {
      order = { col, ascending: opts?.ascending ?? true };
      return builder;
    },
    async maybeSingle() {
      const source = table === "meme_templates" ? templateStore : memeStore;
      const found = source.find((r) => filters.every((f) => f(r)));
      return { data: found ?? null, error: null };
    },
    then(resolve: (v: { data: Row[]; error: null }) => void) {
      const source = table === "meme_templates" ? templateStore : memeStore;
      let rows = source.filter((r) => filters.every((f) => f(r)));
      if (order) {
        const { col, ascending } = order;
        rows = [...rows].sort((a, b) => {
          const av = a[col] as number | string;
          const bv = b[col] as number | string;
          if (av < bv) return ascending ? -1 : 1;
          if (av > bv) return ascending ? 1 : -1;
          return 0;
        });
      }
      resolve({ data: rows, error: null });
    },
  };
  return builder;
}

const supabase = {
  from(table: string) {
    if (table !== "meme_templates" && table !== "meme_creations") {
      throw new Error(`unexpected table ${table}`);
    }
    return makeQuery(table);
  },
};

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

import {
  listTemplates,
  listMyMemes,
  getMemeSignedUrl,
  TEMPLATE_LIST_CACHE_KEY,
} from "../actions";

beforeEach(() => {
  templateStore = [];
  memeStore = [];
  vi.clearAllMocks();
  cacheGetMock.mockResolvedValue(null);
  cacheSetMock.mockResolvedValue(undefined);
  createSignedUrlMock.mockReset();
});

describe("meme-generator server actions", () => {
  describe("listTemplates", () => {
    it("uses CACHE_VERSION in the cache key", () => {
      expect(TEMPLATE_LIST_CACHE_KEY).toBe(
        "meme:templates:active:test-cache-version",
      );
    });

    it("returns cached value without hitting db on hit", async () => {
      const cachedRows = [
        { id: "cached-1", name: "Cached", isActive: true, displayOrder: 1 },
      ];
      cacheGetMock.mockResolvedValueOnce(cachedRows);

      const result = await listTemplates();

      expect(result).toEqual(cachedRows);
      expect(cacheGetMock).toHaveBeenCalledWith(TEMPLATE_LIST_CACHE_KEY);
      expect(cacheSetMock).not.toHaveBeenCalled();
    });

    it("queries db and writes through to cache with TTL=300 on miss", async () => {
      templateStore = [
        {
          id: "a",
          user_id: "n/a",
          name: "A",
          isActive: true,
          displayOrder: 1,
        },
        {
          id: "b",
          user_id: "n/a",
          name: "B",
          isActive: true,
          displayOrder: 2,
        },
      ];

      const result = await listTemplates();

      expect(result.map((r) => r.id)).toEqual(["a", "b"]);
      expect(cacheSetMock).toHaveBeenCalledWith(
        TEMPLATE_LIST_CACHE_KEY,
        expect.any(Array),
        300,
      );
    });

    it("emits a span named memeGenerator.listTemplates", async () => {
      cacheGetMock.mockResolvedValueOnce([]);
      await listTemplates();
      expect(withSpanMock).toHaveBeenCalledWith(
        "memeGenerator.listTemplates",
        expect.objectContaining({ "app.slug": "meme-generator" }),
        expect.any(Function),
      );
    });
  });

  describe("listMyMemes", () => {
    it("returns only the caller's rows with signed URLs (1-hour expiry)", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: TEST_USER_ID,
          title: "mine",
          storagePath: "memes/me/x.png",
          createdAt: "2026-04-29T00:00:00Z",
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          user_id: OTHER_USER_ID,
          title: "theirs",
          storagePath: "memes/them/y.png",
          createdAt: "2026-04-30T00:00:00Z",
        },
      ];
      createSignedUrlMock.mockResolvedValue("https://signed/x.png");

      const result = await listMyMemes();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: VALID_UUID,
        user_id: TEST_USER_ID,
        signedUrl: "https://signed/x.png",
      });
      expect(createSignedUrlMock).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: "memes",
          path: "memes/me/x.png",
          expiresInSeconds: 3600,
        }),
      );
    });

    it("drops rows whose signing throws and returns the rest", async () => {
      // Newer first → VALID_UUID is signed first.
      memeStore = [
        {
          id: VALID_UUID,
          user_id: TEST_USER_ID,
          title: "ok",
          storagePath: "memes/me/ok.png",
          createdAt: "2026-04-30T00:00:00Z",
        },
        {
          id: "55555555-5555-4555-8555-555555555555",
          user_id: TEST_USER_ID,
          title: "bad",
          storagePath: "memes/me/bad.png",
          createdAt: "2026-04-29T00:00:00Z",
        },
      ];
      createSignedUrlMock
        .mockResolvedValueOnce("https://signed/ok.png")
        .mockRejectedValueOnce(new Error("storage gone"));

      const result = await listMyMemes();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(VALID_UUID);
    });

    it("emits a span named memeGenerator.listMyMemes", async () => {
      memeStore = [];
      await listMyMemes();
      expect(withSpanMock).toHaveBeenCalledWith(
        "memeGenerator.listMyMemes",
        expect.objectContaining({ "app.slug": "meme-generator" }),
        expect.any(Function),
      );
    });
  });

  describe("getMemeSignedUrl", () => {
    it("rejects malformed ids without hitting db", async () => {
      const result = await getMemeSignedUrl(INVALID_UUID);
      expect(result).toEqual({ ok: false, error: "invalid input" });
      expect(createSignedUrlMock).not.toHaveBeenCalled();
    });

    it("rejects rows that don't belong to the caller (cross-user)", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: OTHER_USER_ID,
          storagePath: "memes/them/y.png",
        },
      ];

      const result = await getMemeSignedUrl(VALID_UUID);
      expect(result).toEqual({ ok: false, error: "not found" });
      expect(createSignedUrlMock).not.toHaveBeenCalled();
    });

    it("returns a 1-hour signed URL for an owned row", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: TEST_USER_ID,
          storagePath: "memes/me/x.png",
        },
      ];
      createSignedUrlMock.mockResolvedValue("https://signed/me-x.png");

      const result = await getMemeSignedUrl(VALID_UUID);
      expect(result).toEqual({
        ok: true,
        signedUrl: "https://signed/me-x.png",
      });
      expect(createSignedUrlMock).toHaveBeenCalledWith({
        bucket: "memes",
        path: "memes/me/x.png",
        expiresInSeconds: 3600,
      });
    });

    it("emits a span named memeGenerator.getMemeSignedUrl with meme.id attr", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: TEST_USER_ID,
          storagePath: "memes/me/x.png",
        },
      ];
      createSignedUrlMock.mockResolvedValue("https://signed/x.png");

      await getMemeSignedUrl(VALID_UUID);

      expect(withSpanMock).toHaveBeenCalledWith(
        "memeGenerator.getMemeSignedUrl",
        expect.objectContaining({
          "app.slug": "meme-generator",
          "meme.id": VALID_UUID,
        }),
        expect.any(Function),
      );
    });
  });
});
