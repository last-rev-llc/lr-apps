import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @repo/db/server ───────────────────────────────────────────────────
const { mockDbBuilder, mockDbClient } = vi.hoisted(() => {
  const builder: Record<string, any> = {};
  const chainMethods = ["select", "order"];
  for (const m of chainMethods) builder[m] = vi.fn().mockReturnValue(builder);
  builder.then = vi.fn().mockImplementation((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );

  const client = { from: vi.fn().mockReturnValue(builder) };
  return { mockDbBuilder: builder, mockDbClient: client };
});

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockDbClient),
}));

// ── Mock local JSON import ─────────────────────────────────────────────────
vi.mock("../data/gen-x-slang.json", () => ({
  default: [
    {
      id: "rad",
      term: "Rad",
      definition: "Something cool",
      example: "That's rad, dude",
      category: "compliment",
      vibeScore: 8,
      origin: "80s slang",
      era: "1980s",
      aliases: [],
    },
  ],
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockDbClient.from.mockReturnValue(mockDbBuilder);
  for (const m of ["select", "order"]) {
    mockDbBuilder[m].mockReturnValue(mockDbBuilder);
  }
  mockDbBuilder.then.mockImplementation((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );
});

describe("getAllSlang", () => {
  it("returns an array of SlangEntry objects", async () => {
    const { getAllSlang } = await import("../lib/queries");
    const result = await getAllSlang();

    expect(Array.isArray(result)).toBe(true);
  });

  it("includes gen-x entries from local JSON", async () => {
    const { getAllSlang } = await import("../lib/queries");
    const result = await getAllSlang();

    const genXEntries = result.filter((s) => s.generation === "gen-x");
    expect(genXEntries.length).toBeGreaterThan(0);
    expect(genXEntries[0].term).toBe("Rad");
  });

  it("merges gen-alpha entries from supabase with gen-x entries", async () => {
    mockDbBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({
        data: [
          {
            id: "rizz",
            term: "Rizz",
            definition: "Charisma",
            example: "He has rizz",
            category: "compliment",
            vibe_score: 10,
            origin: "Internet",
            era: "2022-present",
            aliases: [],
          },
        ],
        error: null,
      }).then(resolve),
    );

    const { getAllSlang } = await import("../lib/queries");
    const result = await getAllSlang();

    const genAlphaEntries = result.filter((s) => s.generation === "gen-alpha");
    const genXEntries = result.filter((s) => s.generation === "gen-x");

    expect(genAlphaEntries.length).toBeGreaterThan(0);
    expect(genXEntries.length).toBeGreaterThan(0);
  });

  it("throws when supabase returns an error", async () => {
    mockDbBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: null, error: { message: "DB error" } }).then(resolve),
    );

    const { getAllSlang } = await import("../lib/queries");
    await expect(getAllSlang()).rejects.toMatchObject({ message: "DB error" });
  });

  it("calls supabase from 'slang' table", async () => {
    const { getAllSlang } = await import("../lib/queries");
    await getAllSlang();

    expect(mockDbClient.from).toHaveBeenCalledWith("slang");
  });
});
