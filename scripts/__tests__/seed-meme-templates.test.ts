import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn();
const mockFrom = vi.fn((table: string) => {
  if (table !== "meme_templates") {
    throw new Error(`unexpected table: ${table}`);
  }
  return { select: mockSelect, upsert: mockUpsert };
});

vi.mock("../../packages/db/src/service-role.ts", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

const mockUploadFile = vi.fn();
vi.mock("../../packages/storage/src/upload.ts", () => ({
  uploadFile: (...args: unknown[]) => mockUploadFile(...args),
}));

const mockFetch = vi.fn();
const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;
  process.env = { ...ORIGINAL_ENV };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  delete process.env.ANTHROPIC_API_KEY;
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockUpsert.mockResolvedValue({ error: null });
  mockUploadFile.mockResolvedValue({
    bucket: "meme-templates",
    path: "x.png",
  });
});

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
  process.env = { ...ORIGINAL_ENV };
});

const { seed, EXCLUDED_TEMPLATE_IDS } = await import("../seed-meme-templates");

interface ImgflipMeme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

function mockImgflipResponse(
  memes: ImgflipMeme[],
  imageContentType = "image/png",
) {
  mockFetch.mockImplementation(async (url: string) => {
    if (url.includes("api.imgflip.com")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ success: true, data: { memes } }),
      } as unknown as Response;
    }
    // Image download
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": imageContentType }),
      arrayBuffer: async () => new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer,
    } as unknown as Response;
  });
}

describe("seed-meme-templates", () => {
  it("aborts when supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await expect(seed({ dryRun: false, topN: 3 })).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uploads and upserts a 2-zone template using the lookup table", async () => {
    mockImgflipResponse(
      [
        {
          id: "61579",
          name: "One Does Not Simply",
          url: "https://i.imgflip.com/1bij.jpg",
          width: 568,
          height: 335,
          box_count: 2,
        },
      ],
      "image/jpeg",
    );

    const summary = await seed({ dryRun: false, topN: 1 });

    expect(summary.added).toBe(1);
    expect(summary.skipped).toBe(0);
    expect(summary.errors).toBe(0);

    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "meme-templates",
        path: "61579.jpg",
        contentType: "image/jpeg",
        upsert: true,
      }),
    );

    const upsertCall = mockUpsert.mock.calls[0];
    expect(upsertCall[0]).toMatchObject({
      id: "61579",
      name: "One Does Not Simply",
      category: "popular",
      imagePath: "61579.jpg",
      imageWidth: 568,
      imageHeight: 335,
      displayOrder: 1,
      isActive: true,
    });
    expect(Array.isArray(upsertCall[0].textZones)).toBe(true);
    expect(upsertCall[0].textZones).toHaveLength(2);
    expect(upsertCall[1]).toEqual({ onConflict: "id" });

    // Top zone fits within bounds
    const topZone = upsertCall[0].textZones[0];
    expect(topZone.x).toBeGreaterThanOrEqual(0);
    expect(topZone.y).toBeGreaterThanOrEqual(0);
    expect(topZone.x + topZone.width).toBeLessThanOrEqual(568);
    expect(topZone.y + topZone.height).toBeLessThanOrEqual(335);
  });

  it("--dryRun logs and writes nothing", async () => {
    mockImgflipResponse([
      {
        id: "61580",
        name: "Drake",
        url: "https://i.imgflip.com/30b1gx.png",
        width: 1200,
        height: 1200,
        box_count: 2,
      },
    ]);

    const summary = await seed({ dryRun: true, topN: 1 });

    expect(summary.added).toBe(1);
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("skips templates that are already seeded with non-zero displayOrder", async () => {
    mockImgflipResponse([
      {
        id: "existing-1",
        name: "Existing",
        url: "https://i.imgflip.com/x.png",
        width: 600,
        height: 600,
        box_count: 2,
      },
    ]);
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "existing-1", displayOrder: 5 },
      error: null,
    });

    const summary = await seed({ dryRun: false, topN: 1 });

    expect(summary.skipped).toBe(1);
    expect(summary.added).toBe(0);
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("skips templates listed in EXCLUDED_TEMPLATE_IDS", async () => {
    EXCLUDED_TEMPLATE_IDS.add("blocked-1");
    try {
      mockImgflipResponse([
        {
          id: "blocked-1",
          name: "Blocked",
          url: "https://i.imgflip.com/b.png",
          width: 600,
          height: 600,
          box_count: 2,
        },
        {
          id: "ok-1",
          name: "OK",
          url: "https://i.imgflip.com/o.png",
          width: 600,
          height: 600,
          box_count: 2,
        },
      ]);

      const summary = await seed({ dryRun: false, topN: 5 });

      // Only ok-1 should be processed.
      expect(summary.added).toBe(1);
      expect(mockUpsert).toHaveBeenCalledTimes(1);
      const upsertedId = mockUpsert.mock.calls[0][0].id;
      expect(upsertedId).toBe("ok-1");
    } finally {
      EXCLUDED_TEMPLATE_IDS.delete("blocked-1");
    }
  });

  it("logs and skips a template when image download fails after retries", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.imgflip.com")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            success: true,
            data: {
              memes: [
                {
                  id: "broken-1",
                  name: "Broken",
                  url: "https://i.imgflip.com/broken.png",
                  width: 600,
                  height: 600,
                  box_count: 2,
                },
              ],
            },
          }),
        } as unknown as Response;
      }
      return {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as unknown as Response;
    });

    const summary = await seed({ dryRun: false, topN: 1 });
    expect(summary.errors).toBe(1);
    expect(summary.added).toBe(0);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("skips templates with box_count > 4 when ANTHROPIC_API_KEY is missing", async () => {
    mockImgflipResponse([
      {
        id: "wide-1",
        name: "Six Panel",
        url: "https://i.imgflip.com/six.png",
        width: 800,
        height: 600,
        box_count: 6,
      },
    ]);

    const summary = await seed({ dryRun: false, topN: 1 });
    expect(summary.skipped).toBe(1);
    expect(summary.added).toBe(0);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("re-running with no changes results in 0 added / 0 updated", async () => {
    mockImgflipResponse([
      {
        id: "stable-1",
        name: "Stable",
        url: "https://i.imgflip.com/s.png",
        width: 600,
        height: 600,
        box_count: 2,
      },
    ]);
    mockMaybeSingle.mockResolvedValue({
      data: { id: "stable-1", displayOrder: 1 },
      error: null,
    });

    const summary = await seed({ dryRun: false, topN: 1 });
    expect(summary.added).toBe(0);
    expect(summary.updated).toBe(0);
    expect(summary.skipped).toBe(1);
  });
});
