import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "@repo/test-utils";
import type { SlangEntry } from "../types";

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("../../data/gen-x-slang.json", () => ({
  default: [
    {
      id: "as-if",
      term: "As If!",
      definition: "Expression of disbelief",
      example: "As if!",
      category: "Reaction",
      vibeScore: 9,
      origin: "Clueless (1995)",
      aliases: ["as if"],
      era: "90s",
      equivalents: { genAlpha: "Nah fr / Cap" },
    },
    {
      id: "da-bomb",
      term: "Da Bomb",
      definition: "Something extremely cool",
      example: "This is da bomb.",
      category: "Approval",
      vibeScore: 9,
      origin: "90s hip-hop",
      aliases: ["the bomb"],
      era: "90s",
      equivalents: { genAlpha: "Bussin / Fire" },
    },
  ],
}));

import { createClient } from "@repo/db/server";
import { getAllSlang } from "../queries";

const mockCreateClient = vi.mocked(createClient);

function makeEntry(overrides: Partial<SlangEntry> = {}): SlangEntry {
  return {
    id: "skibidi",
    term: "Skibidi",
    definition: "Something wild or chaotic",
    example: "That was so skibidi",
    category: "Reaction",
    vibe_score: 8,
    vibeScore: 8,
    origin: "Internet culture",
    era: "2020s",
    aliases: [],
    generation: "gen-alpha",
    ...overrides,
  };
}

describe("getAllSlang", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges gen-alpha from DB with gen-x from local JSON sorted by vibe_score desc", async () => {
    const dbRows = [
      { id: "skibidi", term: "Skibidi", definition: "Wild", example: "Ex", category: "Reaction", vibe_score: 10, origin: "Internet", era: "2020s", aliases: [] },
      { id: "rizz", term: "Rizz", definition: "Charm", example: "Ex", category: "compliment", vibe_score: 7, origin: "Internet", era: "2020s", aliases: ["charisma"] },
    ];
    const mock = createMockSupabase({ data: dbRows, error: null });
    mockCreateClient.mockResolvedValue(mock as never);

    const result = await getAllSlang();

    // Verify supabase query chain
    expect(mock.from).toHaveBeenCalledWith("slang");
    expect(mock._builder.select).toHaveBeenCalledWith("*");
    expect(mock._builder.order).toHaveBeenCalledWith("vibe_score", { ascending: false });

    // Should have 2 gen-alpha (from DB) + 2 gen-x (from mocked JSON) = 4 total
    expect(result).toHaveLength(4);

    // All gen-alpha entries should have generation set
    const alphaEntries = result.filter((s) => s.generation === "gen-alpha");
    expect(alphaEntries).toHaveLength(2);

    // All gen-x entries should have generation set
    const xEntries = result.filter((s) => s.generation === "gen-x");
    expect(xEntries).toHaveLength(2);

    // Should be sorted by vibe_score descending
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]!.vibe_score ?? result[i - 1]!.vibeScore ?? 0;
      const curr = result[i]!.vibe_score ?? result[i]!.vibeScore ?? 0;
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("throws on supabase error", async () => {
    const mock = createMockSupabase();
    mock._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: { message: "db down" } }).then(resolve),
    );
    mockCreateClient.mockResolvedValue(mock as never);

    await expect(getAllSlang()).rejects.toEqual({ message: "db down" });
  });

  it("handles empty DB result by returning only gen-x entries", async () => {
    const mock = createMockSupabase({ data: [], error: null });
    mockCreateClient.mockResolvedValue(mock as never);

    const result = await getAllSlang();

    // Only the 2 gen-x entries from mocked JSON
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.generation === "gen-x")).toBe(true);
  });
});
