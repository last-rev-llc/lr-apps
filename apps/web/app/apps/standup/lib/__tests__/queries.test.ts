import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabaseClient } from "@repo/test-utils";

let mockSupabase: MockSupabaseClient;

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { getStandupDays } from "../queries";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
  // Reset the builder's then to return empty by default
  mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );
});

describe("getStandupDays", () => {
  it("returns parsed StandupDay array from mock data", async () => {
    const mockData = [
      {
        id: "d1",
        date: "2025-04-07",
        dayOfWeek: "Monday",
        activities: [
          { source: "slack", time: "9:00", description: "Morning standup" },
        ],
        createdAt: "2025-04-07T08:00:00Z",
        updatedAt: "2025-04-07T16:00:00Z",
      },
    ];

    mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: mockData, error: null }).then(resolve),
    );

    const days = await getStandupDays();

    expect(days).toHaveLength(1);
    expect(days[0].id).toBe("d1");
    expect(days[0].dayOfWeek).toBe("Monday");
    expect(days[0].activities).toHaveLength(1);
    expect(days[0].activities[0].source).toBe("slack");
  });

  it("parses JSON string activities correctly", async () => {
    const mockData = [
      {
        id: "d1",
        date: "2025-04-07",
        dayOfWeek: "Monday",
        activities: JSON.stringify([
          { source: "github", time: "11:00", description: "Opened PR" },
        ]),
      },
    ];

    mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: mockData, error: null }).then(resolve),
    );

    const days = await getStandupDays();

    expect(days).toHaveLength(1);
    expect(days[0].activities).toHaveLength(1);
    expect(days[0].activities[0].source).toBe("github");
    expect(days[0].activities[0].description).toBe("Opened PR");
  });

  it("returns empty array on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: { message: "DB error" } }).then(resolve),
    );

    const days = await getStandupDays();

    expect(days).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch standup days:",
      expect.objectContaining({ message: "DB error" }),
    );

    consoleSpy.mockRestore();
  });

  it("returns empty array when data is empty", async () => {
    mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    );

    const days = await getStandupDays();

    expect(days).toEqual([]);
  });

  it("queries from 'days' table with descending date order", async () => {
    await getStandupDays();

    expect(mockSupabase.from).toHaveBeenCalledWith("days");
    expect(mockSupabase._builder.select).toHaveBeenCalledWith("*");
    expect(mockSupabase._builder.order).toHaveBeenCalledWith("date", {
      ascending: false,
    });
  });
});
