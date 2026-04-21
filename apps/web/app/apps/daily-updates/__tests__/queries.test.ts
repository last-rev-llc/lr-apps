import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @repo/db/server ───────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockFrom = vi.fn();

const mockSupabase = {
  from: mockFrom,
};

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

beforeEach(() => {
  vi.clearAllMocks();

  // Default chain setup: from().select().order().limit()
  mockLimit.mockResolvedValue({ data: [], error: null });
  mockOrder.mockReturnValue({ limit: mockLimit, data: [], error: null });
  mockSelect.mockReturnValue({ order: mockOrder, data: [], error: null });
  mockFrom.mockReturnValue({ select: mockSelect });
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("getInitialUpdates", () => {
  it("returns mapped DailyUpdate[] on success", async () => {
    const mockData = [
      {
        id: "u1",
        title: "Deploy complete",
        body: "v2 deployed",
        source_app: "command-center",
        source_name: "Command Center",
        source_icon: "🎮",
        category: "deploy",
        created_at: new Date().toISOString(),
      },
    ];
    mockLimit.mockResolvedValueOnce({ data: mockData, error: null });

    const { getInitialUpdates } = await import("../lib/queries");
    const result = await getInitialUpdates();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Deploy complete");
    expect(result[0].source_app).toBe("command-center");
  });

  it("throws on DB error", async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: new Error("DB error") });

    const { getInitialUpdates } = await import("../lib/queries");
    await expect(getInitialUpdates()).rejects.toThrow("DB error");
  });

  it("queries daily_updates table ordered by created_at desc", async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null });

    const { getInitialUpdates } = await import("../lib/queries");
    await getInitialUpdates();

    expect(mockFrom).toHaveBeenCalledWith("daily_updates");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});

describe("getSourceApps", () => {
  it("returns AppProfile[] on success", async () => {
    const mockProfiles = [
      { id: "cmd", name: "Command Center", icon: "🎮", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    // getSourceApps uses from().select().order() without .limit()
    mockOrder.mockResolvedValueOnce({ data: mockProfiles, error: null });

    const { getSourceApps } = await import("../lib/queries");
    const result = await getSourceApps();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Command Center");
  });

  it("returns empty array on DB error (table may not exist)", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: new Error("relation does not exist") });

    const { getSourceApps } = await import("../lib/queries");
    const result = await getSourceApps();

    expect(result).toEqual([]);
  });
});

describe("getUniqueCategories", () => {
  it("returns deduped sorted categories", async () => {
    const mockData = [
      { category: "deploy" },
      { category: "bugfix" },
      { category: "deploy" },
      { category: "alert" },
    ];
    mockSelect.mockResolvedValueOnce({ data: mockData, error: null });

    const { getUniqueCategories } = await import("../lib/queries");
    const result = await getUniqueCategories();

    expect(result).toEqual(["alert", "bugfix", "deploy"]);
  });

  it("excludes rows with null category", async () => {
    const mockData = [{ category: "deploy" }, { category: null }, { category: "bugfix" }];
    mockSelect.mockResolvedValueOnce({ data: mockData, error: null });

    const { getUniqueCategories } = await import("../lib/queries");
    const result = await getUniqueCategories();

    expect(result).toEqual(["bugfix", "deploy"]);
  });

  it("returns empty array when no data", async () => {
    mockSelect.mockResolvedValueOnce({ data: null, error: null });

    const { getUniqueCategories } = await import("../lib/queries");
    const result = await getUniqueCategories();

    expect(result).toEqual([]);
  });
});
