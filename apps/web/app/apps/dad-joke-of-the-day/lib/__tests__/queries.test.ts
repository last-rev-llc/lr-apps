import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "@repo/test-utils";
import type { DadJoke } from "../types";

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@repo/db/server";
import { getAllJokes, getJokeOfTheDay, getCategories } from "../queries";

const mockCreateClient = vi.mocked(createClient);

function makeJoke(overrides: Partial<DadJoke> = {}): DadJoke {
  return {
    id: 1,
    setup: "Why did the chicken cross the road?",
    punchline: "To get to the other side!",
    category: "Classic",
    rating: null,
    times_rated: 0,
    times_shown: 0,
    featured_date: null,
    ...overrides,
  };
}

describe("getJokeOfTheDay", () => {
  it("returns null for empty array", () => {
    expect(getJokeOfTheDay([])).toBeNull();
  });

  it("returns a deterministic joke based on date seed", () => {
    const jokes = [makeJoke({ id: 1 }), makeJoke({ id: 2 }), makeJoke({ id: 3 })];
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 8)); // April 8, 2026

    const seed = 2026 * 10000 + 4 * 100 + 8; // 20260408
    const expectedIndex = seed % jokes.length;
    expect(getJokeOfTheDay(jokes)).toBe(jokes[expectedIndex]);

    vi.useRealTimers();
  });

  it("returns same joke for same date", () => {
    const jokes = [makeJoke({ id: 1 }), makeJoke({ id: 2 }), makeJoke({ id: 3 })];
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 8));

    const first = getJokeOfTheDay(jokes);
    const second = getJokeOfTheDay(jokes);
    expect(first).toBe(second);

    vi.useRealTimers();
  });

  it("returns different joke for different date", () => {
    const jokes = Array.from({ length: 10 }, (_, i) =>
      makeJoke({ id: i + 1, setup: `Setup ${i}` }),
    );
    vi.useFakeTimers();

    vi.setSystemTime(new Date(2026, 0, 1));
    const jan1 = getJokeOfTheDay(jokes);

    vi.setSystemTime(new Date(2026, 0, 2));
    const jan2 = getJokeOfTheDay(jokes);

    expect(jan1).not.toBe(jan2);
    vi.useRealTimers();
  });
});

describe("getCategories", () => {
  it("returns empty array for no jokes", () => {
    expect(getCategories([])).toEqual([]);
  });

  it("extracts unique sorted categories", () => {
    const jokes = [
      makeJoke({ category: "Puns" }),
      makeJoke({ category: "Animals" }),
      makeJoke({ category: "Puns" }),
      makeJoke({ category: "Classic" }),
    ];
    expect(getCategories(jokes)).toEqual(["Animals", "Classic", "Puns"]);
  });

  it("filters out falsy categories", () => {
    const jokes = [
      makeJoke({ category: "Puns" }),
      makeJoke({ category: "" }),
      makeJoke({ category: undefined as unknown as string }),
    ];
    expect(getCategories(jokes)).toEqual(["Puns"]);
  });
});

describe("getAllJokes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries dad_jokes table and returns data", async () => {
    const mockJokes = [makeJoke({ id: 1 }), makeJoke({ id: 2 })];
    const mock = createMockSupabase({ data: mockJokes, error: null });
    mockCreateClient.mockResolvedValue(mock as never);

    const result = await getAllJokes();

    expect(mock.from).toHaveBeenCalledWith("dad_jokes");
    expect(mock._builder.select).toHaveBeenCalledWith("*");
    expect(mock._builder.order).toHaveBeenCalledWith("featured_date", {
      ascending: false,
    });
    expect(result).toEqual(mockJokes);
  });

  it("returns empty array on error", async () => {
    const mock = createMockSupabase();
    // Override the thenable to return an error
    mock._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: { message: "db down" } }).then(resolve),
    );
    mockCreateClient.mockResolvedValue(mock as never);

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await getAllJokes();

    expect(result).toEqual([]);
    spy.mockRestore();
  });
});
