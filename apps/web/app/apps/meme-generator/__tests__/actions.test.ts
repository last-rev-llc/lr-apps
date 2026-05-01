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

const { createSignedUrlMock, uploadFileMock, deleteFilesMock } = vi.hoisted(
  () => ({
    createSignedUrlMock: vi.fn(),
    uploadFileMock: vi.fn(),
    deleteFilesMock: vi.fn(),
  }),
);
vi.mock("@repo/storage", () => {
  class StorageValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "StorageValidationError";
    }
  }
  return {
    createSignedUrl: (...args: unknown[]) => createSignedUrlMock(...args),
    uploadFile: (...args: unknown[]) => uploadFileMock(...args),
    deleteFiles: (...args: unknown[]) => deleteFilesMock(...args),
    StorageValidationError,
  };
});

const { getSubscriptionMock, hasFeatureAccessMock } = vi.hoisted(() => ({
  getSubscriptionMock: vi.fn(),
  hasFeatureAccessMock: vi.fn(),
}));
vi.mock("@repo/billing", () => {
  class FeatureAccessError extends Error {
    readonly feature: string;
    constructor(feature: string) {
      super(`feature access denied: ${feature}`);
      this.name = "FeatureAccessError";
      this.feature = feature;
    }
  }
  return {
    getSubscription: (...args: unknown[]) => getSubscriptionMock(...args),
    hasFeatureAccess: (...args: unknown[]) => hasFeatureAccessMock(...args),
    FeatureAccessError,
  };
});

const generateCaptionLibMock = vi.fn();
vi.mock("../lib/ai-caption", async () => {
  const actual = await vi.importActual<typeof import("../lib/ai-caption")>(
    "../lib/ai-caption",
  );
  return {
    ...actual,
    generateCaption: (
      ...args: Parameters<typeof actual.generateCaption>
    ) => generateCaptionLibMock(...args),
  };
});

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
let nextRowId = 1;

function makeQuery(table: "meme_templates" | "meme_creations") {
  const filters: Array<(r: Row) => boolean> = [];
  let order: { col: string; ascending: boolean } | null = null;
  let countMode = false;
  let pendingUpdate: Record<string, unknown> | null = null;
  let pendingDelete = false;
  let pendingInsert: Record<string, unknown> | null = null;
  let returnSelected = false;

  const source = () => (table === "meme_templates" ? templateStore : memeStore);
  const matched = () => source().filter((r) => filters.every((f) => f(r)));

  const builder = {
    select(_cols?: string, opts?: { count?: string; head?: boolean }) {
      void _cols;
      if (opts?.count === "exact" && opts?.head) {
        countMode = true;
      }
      returnSelected = true;
      return builder;
    },
    insert(row: Record<string, unknown>) {
      pendingInsert = row;
      return builder;
    },
    update(patch: Record<string, unknown>) {
      pendingUpdate = patch;
      return builder;
    },
    delete() {
      pendingDelete = true;
      return builder;
    },
    eq(col: string, val: unknown) {
      filters.push((r) => r[col] === val);
      return builder;
    },
    order(col: string, opts?: { ascending: boolean }) {
      order = { col, ascending: opts?.ascending ?? true };
      return builder;
    },
    async maybeSingle() {
      const found = source().find((r) => filters.every((f) => f(r)));
      return { data: found ?? null, error: null };
    },
    async single() {
      if (pendingInsert) {
        const newRow: Row = {
          id: pendingInsert.id
            ? String(pendingInsert.id)
            : `seeded-${nextRowId++}`,
          user_id: String(pendingInsert.user_id ?? ""),
          ...pendingInsert,
        };
        source().push(newRow);
        return { data: newRow, error: null };
      }
      if (pendingUpdate) {
        const found = matched()[0];
        if (!found) {
          return { data: null, error: { message: "not found" } };
        }
        Object.assign(found, pendingUpdate);
        return { data: found, error: null };
      }
      const found = matched()[0];
      if (!found) {
        return { data: null, error: { message: "not found" } };
      }
      return { data: found, error: null };
    },
    then(
      resolve: (
        v:
          | { data: Row[] | null; error: null; count?: number }
          | { error: null }
          | { data: Row[]; error: null },
      ) => void,
    ) {
      if (pendingDelete) {
        const remaining = source().filter(
          (r) => !filters.every((f) => f(r)),
        );
        if (table === "meme_templates") {
          templateStore = remaining;
        } else {
          memeStore = remaining;
        }
        resolve({ error: null });
        return;
      }
      if (countMode) {
        resolve({ data: null, error: null, count: matched().length });
        return;
      }
      let rows = matched();
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
      void returnSelected;
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
  saveMeme,
  updateMemeTitle,
  deleteMeme,
  generateMemeCaption,
  TEMPLATE_LIST_CACHE_KEY,
} from "../actions";
import { QuotaExceededError, RateLimitedError } from "../lib/errors";
import { SAVE_QUOTAS } from "../lib/quotas";
import { FeatureAccessError } from "@repo/billing";
import { _resetRateLimitStore } from "@/lib/rate-limit";
import { log } from "@repo/logger";

beforeEach(() => {
  templateStore = [];
  memeStore = [];
  nextRowId = 1;
  vi.clearAllMocks();
  cacheGetMock.mockResolvedValue(null);
  cacheSetMock.mockResolvedValue(undefined);
  createSignedUrlMock.mockReset();
  uploadFileMock.mockReset();
  uploadFileMock.mockResolvedValue({ bucket: "memes", path: "ok" });
  deleteFilesMock.mockReset();
  deleteFilesMock.mockResolvedValue({ bucket: "memes", deleted: [] });
  getSubscriptionMock.mockReset();
  getSubscriptionMock.mockResolvedValue(null);
  hasFeatureAccessMock.mockReset();
  hasFeatureAccessMock.mockResolvedValue(true);
  generateCaptionLibMock.mockReset();
  _resetRateLimitStore();
});

const TEMPLATE_ID = "classic";

function seedClassicTemplate(): void {
  templateStore.push({
    id: TEMPLATE_ID,
    user_id: "n/a",
    name: "Classic",
    isActive: true,
    displayOrder: 1,
    textZones: [
      {
        id: "top",
        label: "Top",
        x: 20,
        y: 20,
        width: 560,
        height: 90,
        align: "center",
      },
      {
        id: "bottom",
        label: "Bottom",
        x: 20,
        y: 340,
        width: 560,
        height: 90,
        align: "center",
      },
    ],
  });
}

function makePngBytes(width = 600, height = 450, padTo = 64): Uint8Array {
  const bytes = new Uint8Array(padTo);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) bytes[i] = sig[i];
  // IHDR chunk length (always 13 — bytes 8..11)
  bytes[8] = 0;
  bytes[9] = 0;
  bytes[10] = 0;
  bytes[11] = 13;
  // "IHDR" — bytes 12..15
  bytes[12] = 0x49;
  bytes[13] = 0x48;
  bytes[14] = 0x44;
  bytes[15] = 0x52;
  bytes[16] = (width >>> 24) & 0xff;
  bytes[17] = (width >>> 16) & 0xff;
  bytes[18] = (width >>> 8) & 0xff;
  bytes[19] = width & 0xff;
  bytes[20] = (height >>> 24) & 0xff;
  bytes[21] = (height >>> 16) & 0xff;
  bytes[22] = (height >>> 8) & 0xff;
  bytes[23] = height & 0xff;
  return bytes;
}

function makePngBlob(width = 600, height = 450, size = 64): Blob {
  const bytes = makePngBytes(width, height, size);
  return new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" });
}

function buildSaveFormData(opts: {
  title?: string;
  templateId?: string;
  textZones?: Record<string, string>;
  fontSize?: number;
  file?: Blob | null;
}): FormData {
  const fd = new FormData();
  fd.set("title", opts.title ?? "My meme");
  fd.set("templateId", opts.templateId ?? TEMPLATE_ID);
  fd.set(
    "textZones",
    JSON.stringify(opts.textZones ?? { top: "WHEN YOU FINALLY", bottom: "SHIP" }),
  );
  fd.set("fontSize", String(opts.fontSize ?? 48));
  if (opts.file !== null) {
    fd.set("file", opts.file ?? makePngBlob());
  }
  return fd;
}

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

  describe("saveMeme", () => {
    beforeEach(() => {
      seedClassicTemplate();
    });

    it("inserts a row at memes/<userId>/<uuid>.png and returns it (under quota)", async () => {
      const fd = buildSaveFormData({
        title: "My first meme",
        textZones: { top: "TOP", bottom: "BOTTOM" },
      });
      const result = await saveMeme(fd);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.meme.user_id).toBe(TEST_USER_ID);
      expect(result.meme.title).toBe("My first meme");
      expect(result.meme.templateId).toBe(TEMPLATE_ID);
      expect(result.meme.textZones).toEqual({ top: "TOP", bottom: "BOTTOM" });
      expect(result.meme.fontSize).toBe(48);
      expect(result.meme.widthPx).toBe(600);
      expect(result.meme.heightPx).toBe(450);
      expect(result.meme.storagePath).toMatch(
        new RegExp(`^${TEST_USER_ID}/[0-9a-f-]+\\.png$`),
      );
      expect(uploadFileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: "memes",
          path: result.meme.storagePath,
          contentType: "image/png",
        }),
        expect.objectContaining({
          maxBytes: 1_048_576,
          allowedMimeTypes: ["image/png"],
        }),
      );
      // Storage path stored in the row matches the upload path.
      expect(result.meme.storagePath).toBe(uploadFileMock.mock.calls[0][0].path);
    });

    it("trims the title before inserting", async () => {
      const fd = buildSaveFormData({ title: "  hello  " });
      const result = await saveMeme(fd);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.meme.title).toBe("hello");
    });

    it("rejects empty/whitespace title before storage write", async () => {
      const fd = buildSaveFormData({ title: "   " });
      const result = await saveMeme(fd);
      expect(result).toEqual({ ok: false, error: "invalid input" });
      expect(uploadFileMock).not.toHaveBeenCalled();
      expect(memeStore).toHaveLength(0);
    });

    it("rejects non-PNG mime type", async () => {
      const fd = buildSaveFormData({
        file: new Blob([makePngBytes().buffer as ArrayBuffer], {
          type: "image/jpeg",
        }),
      });
      const result = await saveMeme(fd);
      expect(result).toEqual({ ok: false, error: "file must be image/png" });
      expect(uploadFileMock).not.toHaveBeenCalled();
    });

    it("rejects oversize PNG before storage write", async () => {
      const big = new Uint8Array(1_048_577);
      // Still mark as PNG so we hit size check
      const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      for (let i = 0; i < sig.length; i++) big[i] = sig[i];
      const fd = buildSaveFormData({
        file: new Blob([big.buffer as ArrayBuffer], { type: "image/png" }),
      });
      const result = await saveMeme(fd);
      expect(result).toEqual({ ok: false, error: "file too large" });
      expect(uploadFileMock).not.toHaveBeenCalled();
    });

    it("rejects PNG with invalid dimensions", async () => {
      const tiny = new Uint8Array(8);
      const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      for (let i = 0; i < sig.length; i++) tiny[i] = sig[i];
      const fd = buildSaveFormData({
        file: new Blob([tiny.buffer as ArrayBuffer], { type: "image/png" }),
      });
      const result = await saveMeme(fd);
      expect(result).toEqual({ ok: false, error: "invalid PNG" });
      expect(uploadFileMock).not.toHaveBeenCalled();
    });

    it("rejects unknown zone ids", async () => {
      const fd = buildSaveFormData({
        textZones: { not_a_zone: "x" },
      });
      const result = await saveMeme(fd);
      expect(result).toEqual({ ok: false, error: "invalid zone id" });
      expect(uploadFileMock).not.toHaveBeenCalled();
    });

    it("rejects when template is not active", async () => {
      templateStore = [
        { ...templateStore[0], isActive: false },
      ] as Row[];
      const fd = buildSaveFormData({});
      const result = await saveMeme(fd);
      expect(result).toEqual({ ok: false, error: "template not found" });
      expect(uploadFileMock).not.toHaveBeenCalled();
    });

    it("succeeds at count == limit-1 (free tier, count=4 / limit=5)", async () => {
      for (let i = 0; i < SAVE_QUOTAS.free - 1; i++) {
        memeStore.push({
          id: `seed-${i}`,
          user_id: TEST_USER_ID,
          title: `m${i}`,
          storagePath: `${TEST_USER_ID}/s${i}.png`,
        });
      }
      const fd = buildSaveFormData({});
      const result = await saveMeme(fd);
      expect(result.ok).toBe(true);
      expect(uploadFileMock).toHaveBeenCalledTimes(1);
    });

    it("rejects with QuotaExceededError at count == limit (free tier)", async () => {
      for (let i = 0; i < SAVE_QUOTAS.free; i++) {
        memeStore.push({
          id: `seed-${i}`,
          user_id: TEST_USER_ID,
          title: `m${i}`,
          storagePath: `${TEST_USER_ID}/s${i}.png`,
        });
      }
      const fd = buildSaveFormData({});
      await expect(saveMeme(fd)).rejects.toMatchObject({
        name: "QuotaExceededError",
        feature: "memes:save-quota",
        current: SAVE_QUOTAS.free,
        limit: SAVE_QUOTAS.free,
        upgradeTier: "pro",
      });
      expect(uploadFileMock).not.toHaveBeenCalled();
    });

    it("upgradeTier is 'enterprise' for pro tier at quota", async () => {
      getSubscriptionMock.mockResolvedValue({
        tier: "pro",
        status: "active",
      });
      for (let i = 0; i < SAVE_QUOTAS.pro; i++) {
        memeStore.push({
          id: `seed-${i}`,
          user_id: TEST_USER_ID,
          title: `m${i}`,
          storagePath: `${TEST_USER_ID}/s${i}.png`,
        });
      }
      try {
        await saveMeme(buildSaveFormData({}));
        throw new Error("expected throw");
      } catch (err) {
        if (!(err instanceof QuotaExceededError)) throw err;
        expect(err.upgradeTier).toBe("enterprise");
        expect(err.limit).toBe(SAVE_QUOTAS.pro);
      }
    });

    it("upgradeTier is undefined for enterprise tier at quota", async () => {
      getSubscriptionMock.mockResolvedValue({
        tier: "enterprise",
        status: "active",
      });
      for (let i = 0; i < SAVE_QUOTAS.enterprise; i++) {
        memeStore.push({
          id: `seed-${i}`,
          user_id: TEST_USER_ID,
          title: `m${i}`,
          storagePath: `${TEST_USER_ID}/s${i}.png`,
        });
      }
      try {
        await saveMeme(buildSaveFormData({}));
        throw new Error("expected throw");
      } catch (err) {
        if (!(err instanceof QuotaExceededError)) throw err;
        expect(err.upgradeTier).toBeUndefined();
        expect(err.limit).toBe(SAVE_QUOTAS.enterprise);
      }
    });

    it("emits a span named meme-generator.saveMeme", async () => {
      const fd = buildSaveFormData({});
      await saveMeme(fd);
      expect(withSpanMock).toHaveBeenCalledWith(
        "meme-generator.saveMeme",
        expect.objectContaining({ "app.slug": "meme-generator" }),
        expect.any(Function),
      );
    });
  });

  describe("updateMemeTitle", () => {
    it("rejects empty/whitespace title without hitting db", async () => {
      memeStore = [
        { id: VALID_UUID, user_id: TEST_USER_ID, title: "old" },
      ];
      const result = await updateMemeTitle(VALID_UUID, "   ");
      expect(result).toEqual({ ok: false, error: "invalid input" });
      expect(memeStore[0].title).toBe("old");
    });

    it("rejects titles >200 chars", async () => {
      memeStore = [
        { id: VALID_UUID, user_id: TEST_USER_ID, title: "old" },
      ];
      const result = await updateMemeTitle(VALID_UUID, "x".repeat(201));
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("rejects malformed id", async () => {
      const result = await updateMemeTitle(INVALID_UUID, "fine title");
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("updates title for an owned row and returns it (trimmed)", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: TEST_USER_ID,
          title: "old",
          storagePath: `${TEST_USER_ID}/x.png`,
        },
      ];
      const result = await updateMemeTitle(VALID_UUID, "  fresh title  ");
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.meme.title).toBe("fresh title");
      expect(memeStore[0].title).toBe("fresh title");
    });

    it("returns not-found for cross-user update (cannot modify another user's row)", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: OTHER_USER_ID,
          title: "theirs",
        },
      ];
      const result = await updateMemeTitle(VALID_UUID, "hijacked");
      expect(result).toEqual({ ok: false, error: "not found" });
      expect(memeStore[0].title).toBe("theirs");
    });

    it("emits a span named meme-generator.updateMemeTitle", async () => {
      memeStore = [{ id: VALID_UUID, user_id: TEST_USER_ID, title: "old" }];
      await updateMemeTitle(VALID_UUID, "new");
      expect(withSpanMock).toHaveBeenCalledWith(
        "meme-generator.updateMemeTitle",
        expect.objectContaining({ "app.slug": "meme-generator" }),
        expect.any(Function),
      );
    });
  });

  describe("deleteMeme", () => {
    it("removes both row and blob in the happy path", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: TEST_USER_ID,
          storagePath: `${TEST_USER_ID}/x.png`,
        },
      ];
      const result = await deleteMeme(VALID_UUID);
      expect(result).toEqual({ ok: true });
      expect(memeStore).toHaveLength(0);
      expect(deleteFilesMock).toHaveBeenCalledWith({
        bucket: "memes",
        paths: [`${TEST_USER_ID}/x.png`],
      });
    });

    it("returns not-found for cross-user delete (cannot delete another user's row)", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: OTHER_USER_ID,
          storagePath: `${OTHER_USER_ID}/y.png`,
        },
      ];
      const result = await deleteMeme(VALID_UUID);
      expect(result).toEqual({ ok: false, error: "not found" });
      expect(memeStore).toHaveLength(1);
      expect(deleteFilesMock).not.toHaveBeenCalled();
    });

    it("rejects malformed id without hitting db", async () => {
      const result = await deleteMeme(INVALID_UUID);
      expect(result).toEqual({ ok: false, error: "invalid input" });
      expect(deleteFilesMock).not.toHaveBeenCalled();
    });

    it("still resolves ok and logs a needs-sweep warning when blob delete fails", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: TEST_USER_ID,
          storagePath: `${TEST_USER_ID}/x.png`,
        },
      ];
      deleteFilesMock.mockRejectedValueOnce(new Error("storage down"));
      const warnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});

      const result = await deleteMeme(VALID_UUID);
      expect(result).toEqual({ ok: true });
      expect(memeStore).toHaveLength(0);
      const sweepCall = warnSpy.mock.calls.find(
        (c) =>
          (c[1] as Record<string, unknown> | undefined)?.phase ===
          "delete-blob",
      );
      expect(sweepCall).toBeDefined();
      expect(sweepCall?.[1]).toMatchObject({
        feature: "meme-generator",
        phase: "delete-blob",
        memeId: VALID_UUID,
        storagePath: `${TEST_USER_ID}/x.png`,
      });
      warnSpy.mockRestore();
    });

    it("emits a span named meme-generator.deleteMeme", async () => {
      memeStore = [
        {
          id: VALID_UUID,
          user_id: TEST_USER_ID,
          storagePath: `${TEST_USER_ID}/x.png`,
        },
      ];
      await deleteMeme(VALID_UUID);
      expect(withSpanMock).toHaveBeenCalledWith(
        "meme-generator.deleteMeme",
        expect.objectContaining({ "app.slug": "meme-generator" }),
        expect.any(Function),
      );
    });
  });

  describe("generateMemeCaption", () => {
    beforeEach(() => {
      seedClassicTemplate();
      generateCaptionLibMock.mockResolvedValue({
        top: "WHEN YOU FINALLY",
        bottom: "SHIP THE FEATURE",
      });
    });

    it("rejects empty topic without invoking the model", async () => {
      const result = await generateMemeCaption({
        topic: "  ",
        templateId: TEMPLATE_ID,
      });
      expect(result).toEqual({ ok: false, error: "invalid input" });
      expect(generateCaptionLibMock).not.toHaveBeenCalled();
    });

    it("throws FeatureAccessError for free-tier callers", async () => {
      hasFeatureAccessMock.mockResolvedValueOnce(false);
      await expect(
        generateMemeCaption({ topic: "shipping", templateId: TEMPLATE_ID }),
      ).rejects.toBeInstanceOf(FeatureAccessError);
      expect(generateCaptionLibMock).not.toHaveBeenCalled();
    });

    it("returns captions keyed by zone id (pro-tier)", async () => {
      const result = await generateMemeCaption({
        topic: "shipping a feature",
        templateId: TEMPLATE_ID,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(Object.keys(result.captions).sort()).toEqual(["bottom", "top"]);
      expect(result.captions.top).toBe("WHEN YOU FINALLY");
      expect(result.captions.bottom).toBe("SHIP THE FEATURE");
    });

    it("rate-limits to 30/hour/user — 31st throws RateLimitedError without invoking the model", async () => {
      for (let i = 0; i < 30; i++) {
        const r = await generateMemeCaption({
          topic: `t-${i}`,
          templateId: TEMPLATE_ID,
        });
        expect(r.ok).toBe(true);
      }
      expect(generateCaptionLibMock).toHaveBeenCalledTimes(30);
      generateCaptionLibMock.mockClear();
      await expect(
        generateMemeCaption({ topic: "after-limit", templateId: TEMPLATE_ID }),
      ).rejects.toBeInstanceOf(RateLimitedError);
      expect(generateCaptionLibMock).not.toHaveBeenCalled();
    });

    it("emits a span named meme-generator.generateMemeCaption", async () => {
      await generateMemeCaption({
        topic: "anything",
        templateId: TEMPLATE_ID,
      });
      expect(withSpanMock).toHaveBeenCalledWith(
        "meme-generator.generateMemeCaption",
        expect.objectContaining({ "app.slug": "meme-generator" }),
        expect.any(Function),
      );
    });

    it("returns not-found if template is inactive", async () => {
      templateStore = [{ ...templateStore[0], isActive: false }] as Row[];
      const result = await generateMemeCaption({
        topic: "x",
        templateId: TEMPLATE_ID,
      });
      expect(result).toEqual({ ok: false, error: "template not found" });
      expect(generateCaptionLibMock).not.toHaveBeenCalled();
    });
  });
});
