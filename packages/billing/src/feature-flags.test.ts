import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSubscription = vi.fn();
vi.mock("./subscriptions", () => ({
  getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
}));

let queryRows: Array<{
  user_id: string | null;
  tier: string | null;
  enabled: boolean;
}> = [];
const mockEq = vi.fn(async () => ({ data: queryRows, error: null }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { getFeatureFlagValue } from "./feature-flags";

describe("getFeatureFlagValue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRows = [];
    mockGetSubscription.mockResolvedValue(null);
  });

  it("returns user-specific override when present (wins over tier and global)", async () => {
    queryRows = [
      { user_id: "user-1", tier: null, enabled: true },
      { user_id: null, tier: "pro", enabled: false },
      { user_id: null, tier: null, enabled: false },
    ];
    mockGetSubscription.mockResolvedValue({ tier: "pro", status: "active" });
    expect(await getFeatureFlagValue("user-1", "flag")).toBe(true);
  });

  it("returns tier-level flag when no user override exists", async () => {
    queryRows = [
      { user_id: null, tier: "pro", enabled: true },
      { user_id: null, tier: null, enabled: false },
    ];
    mockGetSubscription.mockResolvedValue({ tier: "pro", status: "active" });
    expect(await getFeatureFlagValue("user-1", "flag")).toBe(true);
  });

  it("falls through tier when user is on a different tier", async () => {
    queryRows = [
      { user_id: null, tier: "enterprise", enabled: true },
      { user_id: null, tier: null, enabled: false },
    ];
    mockGetSubscription.mockResolvedValue({ tier: "pro", status: "active" });
    expect(await getFeatureFlagValue("user-1", "flag")).toBe(false);
  });

  it("returns global default when no user override or tier match", async () => {
    queryRows = [{ user_id: null, tier: null, enabled: true }];
    mockGetSubscription.mockResolvedValue(null);
    expect(await getFeatureFlagValue("user-1", "flag")).toBe(true);
  });

  it("defaults to false when no rows match", async () => {
    queryRows = [];
    expect(await getFeatureFlagValue("user-1", "flag")).toBe(false);
  });

  it("treats absent subscription as free tier", async () => {
    queryRows = [
      { user_id: null, tier: "free", enabled: true },
      { user_id: null, tier: null, enabled: false },
    ];
    mockGetSubscription.mockResolvedValue(null);
    expect(await getFeatureFlagValue("user-1", "flag")).toBe(true);
  });

  it("user override 'false' overrides a global 'true'", async () => {
    queryRows = [
      { user_id: "user-1", tier: null, enabled: false },
      { user_id: null, tier: null, enabled: true },
    ];
    expect(await getFeatureFlagValue("user-1", "flag")).toBe(false);
  });
});
