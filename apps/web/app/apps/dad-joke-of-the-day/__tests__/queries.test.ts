import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DadJoke } from "../lib/types";

// ── Mock data ──────────────────────────────────────────────────────────────

function makeJoke(overrides: Partial<DadJoke> = {}): DadJoke {
  return {
    id: 1,
    setup: "Why did the scarecrow win an award?",
    punchline: "Because he was outstanding in his field.",
    category: "Puns",
    rating: null,
    times_rated: 0,
    times_shown: 0,
    featured_date: null,
    ...overrides,
  };
}

const JOKES: DadJoke[] = [
  makeJoke({ id: 1, category: "Puns" }),
  makeJoke({ id: 2, category: "Animals" }),
  makeJoke({ id: 3, category: "Puns" }),
  makeJoke({ id: 4, category: "Food" }),
  makeJoke({ id: 5, category: "Animals" }),
];

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const { mockBuilder, mockSupabase } = vi.hoisted(() => {
  const builder: Record<string, any> = {};
  const chainMethods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "order", "limit"];
  for (const m of chainMethods) builder[m] = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.then = vi.fn().mockImplementation((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );

  const client = {
    from: vi.fn().mockReturnValue(builder),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _builder: builder,
  };
  return { mockBuilder: builder, mockSupabase: client };
});

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase._builder.then.mockImplementation((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );
});

// ── getJokeOfTheDay ────────────────────────────────────────────────────────

describe("getJokeOfTheDay", () => {
  it("returns null for empty jokes array", async () => {
    const { getJokeOfTheDay } = await import("../lib/queries");
    expect(getJokeOfTheDay([])).toBeNull();
  });

  it("returns a joke from the array", async () => {
    const { getJokeOfTheDay } = await import("../lib/queries");
    const result = getJokeOfTheDay(JOKES);
    expect(result).not.toBeNull();
    expect(JOKES).toContain(result);
  });

  it("returns the same joke for the same date (deterministic)", async () => {
    const { getJokeOfTheDay } = await import("../lib/queries");
    const result1 = getJokeOfTheDay(JOKES);
    const result2 = getJokeOfTheDay(JOKES);
    expect(result1).toBe(result2);
  });

  it("uses seed formula: year*10000 + month*100 + day", async () => {
    const { getJokeOfTheDay } = await import("../lib/queries");
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    const expected = JOKES[seed % JOKES.length];
    expect(getJokeOfTheDay(JOKES)).toBe(expected);
  });

  it("returns a valid joke when only one joke exists", async () => {
    const { getJokeOfTheDay } = await import("../lib/queries");
    const single = [makeJoke({ id: 99 })];
    expect(getJokeOfTheDay(single)).toBe(single[0]);
  });
});

// ── getCategories ──────────────────────────────────────────────────────────

describe("getCategories", () => {
  it("returns empty array for empty jokes", async () => {
    const { getCategories } = await import("../lib/queries");
    expect(getCategories([])).toEqual([]);
  });

  it("returns unique categories sorted alphabetically", async () => {
    const { getCategories } = await import("../lib/queries");
    expect(getCategories(JOKES)).toEqual(["Animals", "Food", "Puns"]);
  });

  it("deduplicates repeated categories", async () => {
    const { getCategories } = await import("../lib/queries");
    const result = getCategories(JOKES);
    expect(result.length).toBe(3);
  });

  it("filters out falsy category values", async () => {
    const { getCategories } = await import("../lib/queries");
    const jokes = [
      makeJoke({ id: 1, category: "Puns" }),
      makeJoke({ id: 2, category: "" }),
    ];
    expect(getCategories(jokes)).toEqual(["Puns"]);
  });
});

// ── getAllJokes ────────────────────────────────────────────────────────────

describe("getAllJokes", () => {
  it("queries dad_jokes table ordered by featured_date descending", async () => {
    mockSupabase._builder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: JOKES, error: null }).then(resolve),
    );

    const { getAllJokes } = await import("../lib/queries");
    await getAllJokes();

    expect(mockSupabase.from).toHaveBeenCalledWith("dad_jokes");
    expect(mockBuilder.select).toHaveBeenCalledWith("*");
    expect(mockBuilder.order).toHaveBeenCalledWith("featured_date", { ascending: false });
  });

  it("returns jokes array on success", async () => {
    mockSupabase._builder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: JOKES, error: null }).then(resolve),
    );

    const { getAllJokes } = await import("../lib/queries");
    const result = await getAllJokes();
    expect(result).toEqual(JOKES);
  });

  it("returns empty array on error", async () => {
    mockSupabase._builder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: null, error: { message: "DB error" } }).then(resolve),
    );

    const { getAllJokes } = await import("../lib/queries");
    const result = await getAllJokes();
    expect(result).toEqual([]);
  });

  it("returns empty array when data is null with no error", async () => {
    mockSupabase._builder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
    );

    const { getAllJokes } = await import("../lib/queries");
    const result = await getAllJokes();
    expect(result).toEqual([]);
  });
});
