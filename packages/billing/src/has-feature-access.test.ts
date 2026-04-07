import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSubscription = vi.fn();
vi.mock("./subscriptions", () => ({
  getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
}));

import { hasFeatureAccess } from "./has-feature-access";

describe("hasFeatureAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grants free users access to basic features", async () => {
    mockGetSubscription.mockResolvedValue({ tier: "free" });
    expect(await hasFeatureAccess("user-1", "basic")).toBe(true);
  });

  it("denies free users access to pro features", async () => {
    mockGetSubscription.mockResolvedValue({ tier: "free" });
    expect(await hasFeatureAccess("user-1", "advanced")).toBe(false);
  });

  it("grants pro users access to pro features", async () => {
    mockGetSubscription.mockResolvedValue({ tier: "pro" });
    expect(await hasFeatureAccess("user-1", "advanced")).toBe(true);
  });

  it("grants enterprise users access to all features", async () => {
    mockGetSubscription.mockResolvedValue({ tier: "enterprise" });
    expect(await hasFeatureAccess("user-1", "basic")).toBe(true);
    expect(await hasFeatureAccess("user-1", "advanced")).toBe(true);
    expect(await hasFeatureAccess("user-1", "custom")).toBe(true);
  });

  it("defaults to free tier when no subscription exists", async () => {
    mockGetSubscription.mockResolvedValue(null);
    expect(await hasFeatureAccess("user-1", "basic")).toBe(true);
    expect(await hasFeatureAccess("user-1", "advanced")).toBe(false);
  });

  it("returns false for unknown features", async () => {
    mockGetSubscription.mockResolvedValue({ tier: "enterprise" });
    expect(await hasFeatureAccess("user-1", "nonexistent")).toBe(false);
  });
});
