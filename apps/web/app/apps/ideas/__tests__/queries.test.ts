import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Idea } from "../lib/types";

interface ChainCalls {
  from?: string;
  select?: string;
  neq?: [string, unknown];
  orderCalls: Array<[string, { ascending?: boolean; nullsFirst?: boolean }]>;
}

const calls: ChainCalls = { orderCalls: [] };
let resolved: { data: unknown; error: unknown } = { data: [], error: null };

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  builder.select = (cols: string) => {
    calls.select = cols;
    return builder;
  };
  builder.neq = (col: string, val: unknown) => {
    calls.neq = [col, val];
    return builder;
  };
  builder.order = (
    col: string,
    opts: { ascending?: boolean; nullsFirst?: boolean } = {},
  ) => {
    calls.orderCalls.push([col, opts]);
    return builder;
  };
  // The chain is awaited after the second .order(), so make the builder
  // thenable so `await ...order().order()` resolves to the fixture.
  (builder as { then: unknown }).then = (
    onResolve: (value: { data: unknown; error: unknown }) => void,
  ) => Promise.resolve(resolved).then(onResolve);
  return builder;
}

const mockClient = {
  from: vi.fn((table: string) => {
    calls.from = table;
    return makeBuilder();
  }),
};

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import { getIdeas } from "../lib/queries";

beforeEach(() => {
  calls.from = undefined;
  calls.select = undefined;
  calls.neq = undefined;
  calls.orderCalls = [];
  resolved = { data: [], error: null };
  vi.clearAllMocks();
});

describe("getIdeas", () => {
  it("queries the 'ideas' table", async () => {
    await getIdeas();
    expect(calls.from).toBe("ideas");
  });

  it("excludes archived ideas via .neq('status', 'archived')", async () => {
    await getIdeas();
    expect(calls.neq).toEqual(["status", "archived"]);
  });

  it("sorts by compositeScore desc nulls last, then createdAt desc", async () => {
    await getIdeas();
    expect(calls.orderCalls).toHaveLength(2);
    expect(calls.orderCalls[0]).toEqual([
      "compositeScore",
      { ascending: false, nullsFirst: false },
    ]);
    expect(calls.orderCalls[1][0]).toBe("createdAt");
    expect(calls.orderCalls[1][1].ascending).toBe(false);
  });

  it("round-trips a jsonb tags array on returned rows", async () => {
    const fixture: Partial<Idea>[] = [
      {
        id: "abc",
        title: "Tagged",
        tags: ["alpha", "beta"],
        category: "Product",
        status: "new",
        source: "manual",
      },
    ];
    resolved = { data: fixture, error: null };
    const result = await getIdeas();
    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual(["alpha", "beta"]);
    expect(Array.isArray(result[0].tags)).toBe(true);
  });

  it("returns [] on db error", async () => {
    resolved = { data: null, error: { message: "boom" } };
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await getIdeas();
    expect(result).toEqual([]);
    errSpy.mockRestore();
  });

  it("returns [] when data is null but no error", async () => {
    resolved = { data: null, error: null };
    const result = await getIdeas();
    expect(result).toEqual([]);
  });
});
