import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabaseClient } from "@repo/test-utils";

let mockSupabase: MockSupabaseClient;

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { getMeetings, computeStats } from "../queries";
import type { ZoomTranscript } from "../types";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
  mockSupabase._builder.then.mockImplementation(
    (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  );
});

describe("getMeetings", () => {
  it("queries zoom_transcripts table ordered by start_time desc", async () => {
    await getMeetings();

    expect(mockSupabase.from).toHaveBeenCalledWith("zoom_transcripts");
    expect(mockSupabase._builder.select).toHaveBeenCalledWith("*");
    expect(mockSupabase._builder.order).toHaveBeenCalledWith("start_time", {
      ascending: false,
    });
  });

  it("returns meetings from supabase", async () => {
    const mockData = [
      { id: "m1", topic: "Sprint Planning", duration: 60 },
      { id: "m2", topic: "Design Review", duration: 30 },
    ];

    mockSupabase._builder.then.mockImplementation(
      (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: mockData, error: null }).then(resolve),
    );

    const result = await getMeetings();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("m1");
    expect(result[1].topic).toBe("Design Review");
  });

  it("throws on supabase error", async () => {
    mockSupabase._builder.then.mockImplementation(
      (resolve: (v: unknown) => unknown) =>
        Promise.resolve({
          data: null,
          error: { message: "DB error", code: "500" },
        }).then(resolve),
    );

    await expect(getMeetings()).rejects.toEqual(
      expect.objectContaining({ message: "DB error" }),
    );
  });
});

describe("computeStats", () => {
  it("returns correct total, summarized, actionItems, hoursTotal", () => {
    const meetings: ZoomTranscript[] = [
      {
        id: "m1",
        summary: "Some summary",
        duration: 90,
        action_items: [
          { action: "Task 1", priority: "high" },
          { action: "Task 2", priority: "medium" },
        ],
      },
      {
        id: "m2",
        summary: "Another summary",
        duration: 30,
        action_items: [{ action: "Task 3", priority: "low" }],
      },
      {
        id: "m3",
        duration: 60,
        action_items: [],
      },
    ];

    const stats = computeStats(meetings);

    expect(stats.total).toBe(3);
    expect(stats.summarized).toBe(2);
    expect(stats.actionItems).toBe(3);
    expect(stats.hoursTotal).toBe(3); // (90 + 30 + 60) / 60 = 3
  });

  it("handles empty array", () => {
    const stats = computeStats([]);

    expect(stats.total).toBe(0);
    expect(stats.summarized).toBe(0);
    expect(stats.actionItems).toBe(0);
    expect(stats.hoursTotal).toBe(0);
  });

  it("handles string-encoded action_items JSON", () => {
    const meetings: ZoomTranscript[] = [
      {
        id: "m1",
        summary: "Has summary",
        duration: 60,
        action_items: JSON.stringify([
          { action: "Task A" },
          { action: "Task B" },
        ]) as unknown as string,
      },
    ];

    const stats = computeStats(meetings);

    expect(stats.actionItems).toBe(2);
    expect(stats.hoursTotal).toBe(1);
  });
});
