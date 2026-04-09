import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabaseClient } from "@repo/test-utils";

let mockSupabase: MockSupabaseClient;

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { getArchives } from "../queries";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

describe("getArchives", () => {
  it("queries daily_digests, daily_overviews, and weekly_summaries tables", async () => {
    mockSupabase._builder.then
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
      )
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
      )
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
      );

    await getArchives();

    expect(mockSupabase.from).toHaveBeenCalledWith("daily_digests");
    expect(mockSupabase.from).toHaveBeenCalledWith("daily_overviews");
    expect(mockSupabase.from).toHaveBeenCalledWith("weekly_summaries");
  });

  it("returns merged results tagged with _type", async () => {
    const digestRow = { id: "d1", date: "2026-04-08", summary: "digest" };
    const overviewRow = { id: "o1", date: "2026-04-07", summary: "overview" };
    const weeklyRow = {
      id: "w1",
      start_date: "2026-04-06",
      summary: "weekly",
    };

    mockSupabase._builder.then
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [digestRow], error: null }).then(resolve),
      )
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [overviewRow], error: null }).then(resolve),
      )
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [weeklyRow], error: null }).then(resolve),
      );

    const result = await getArchives();

    expect(result).toHaveLength(3);

    const digest = result.find((r) => r.id === "d1");
    expect(digest?._type).toBe("digest");

    const overview = result.find((r) => r.id === "o1");
    expect(overview?._type).toBe("overview");

    const weekly = result.find((r) => r.id === "w1");
    expect(weekly?._type).toBe("weekly");
    // weekly uses start_date as the date field
    expect(weekly?.date).toBe("2026-04-06");
  });

  it("returns results sorted by date descending", async () => {
    const olderDigest = { id: "d1", date: "2026-03-01" };
    const newerOverview = { id: "o1", date: "2026-04-08" };
    const middleWeekly = { id: "w1", start_date: "2026-04-01" };

    mockSupabase._builder.then
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [olderDigest], error: null }).then(resolve),
      )
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [newerOverview], error: null }).then(resolve),
      )
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [middleWeekly], error: null }).then(resolve),
      );

    const result = await getArchives();

    expect(result[0].id).toBe("o1"); // newest first
    expect(result[1].id).toBe("w1");
    expect(result[2].id).toBe("d1"); // oldest last
  });

  it("handles null data from a table gracefully", async () => {
    mockSupabase._builder.then
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        // Simulate DB error returning null data
        Promise.resolve({ data: null, error: { message: "DB error" } }).then(
          resolve,
        ),
      )
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({
          data: [{ id: "o1", date: "2026-04-08" }],
          error: null,
        }).then(resolve),
      )
      .mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
      );

    const result = await getArchives();

    // digests returned null → treated as empty; only overview row appears
    expect(result.filter((r) => r._type === "digest")).toHaveLength(0);
    expect(result.filter((r) => r._type === "overview")).toHaveLength(1);
  });
});
