import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @repo/db/server ───────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

const mockSupabase = { from: mockFrom };

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockSelect.mockReturnValue({ order: mockOrder });
  mockFrom.mockReturnValue({ select: mockSelect });
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("getWinePours", () => {
  it("returns mapped WinePour[] on success", async () => {
    const mockData = [
      {
        id: "p1",
        restaurant_name: "Gary Danko",
        wine_name: "Caymus Cabernet",
        pour_rating: "generous",
        price_paid: 28,
        notes: "Perfect pour",
        user_name: "Alice",
        created_at: new Date().toISOString(),
      },
    ];
    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    const { getWinePours } = await import("../lib/queries");
    const result = await getWinePours();

    expect(result).toHaveLength(1);
    expect(result[0].restaurant_name).toBe("Gary Danko");
    expect(result[0].wine_name).toBe("Caymus Cabernet");
    expect(result[0].pour_rating).toBe("generous");
    expect(result[0].price_paid).toBe(28);
    expect(result[0].user_name).toBe("Alice");
  });

  it("returns empty array on DB error", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: new Error("Table not found") });

    const { getWinePours } = await import("../lib/queries");
    const result = await getWinePours();

    expect(result).toEqual([]);
  });

  it("applies defaults for missing fields", async () => {
    const mockData = [{ id: "p2", created_at: new Date().toISOString() }];
    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    const { getWinePours } = await import("../lib/queries");
    const result = await getWinePours();

    expect(result[0].restaurant_name).toBe("");
    expect(result[0].wine_name).toBe("");
    expect(result[0].pour_rating).toBe("standard");
    expect(result[0].user_name).toBe("Anonymous");
    expect(result[0].price_paid).toBeNull();
    expect(result[0].notes).toBeNull();
  });

  it("queries wine_pours table ordered by created_at desc", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { getWinePours } = await import("../lib/queries");
    await getWinePours();

    expect(mockFrom).toHaveBeenCalledWith("wine_pours");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});

describe("getWallPosts", () => {
  it("returns mapped WallPost[] on success", async () => {
    const mockData = [
      {
        id: "w1",
        user_name: "Bob",
        pour_type: "glory",
        content: "Best pour ever!",
        upvotes: 5,
        created_at: new Date().toISOString(),
      },
    ];
    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    const { getWallPosts } = await import("../lib/queries");
    const result = await getWallPosts();

    expect(result).toHaveLength(1);
    expect(result[0].user_name).toBe("Bob");
    expect(result[0].pour_type).toBe("glory");
    expect(result[0].content).toBe("Best pour ever!");
    expect(result[0].upvotes).toBe(5);
  });

  it("returns empty array on DB error", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: new Error("Connection failed") });

    const { getWallPosts } = await import("../lib/queries");
    const result = await getWallPosts();

    expect(result).toEqual([]);
  });

  it("applies defaults for missing fields", async () => {
    const mockData = [{ id: "w2", created_at: new Date().toISOString() }];
    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    const { getWallPosts } = await import("../lib/queries");
    const result = await getWallPosts();

    expect(result[0].user_name).toBe("Anonymous");
    expect(result[0].pour_type).toBe("glory");
    expect(result[0].content).toBe("");
    expect(result[0].upvotes).toBe(0);
  });

  it("queries pour_wall table ordered by created_at desc", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { getWallPosts } = await import("../lib/queries");
    await getWallPosts();

    expect(mockFrom).toHaveBeenCalledWith("pour_wall");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});
