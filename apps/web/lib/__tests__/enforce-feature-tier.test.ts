import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/billing", () => ({
  hasFeatureAccess: vi.fn(),
  getFeatureFlagValue: vi.fn(),
}));

import { hasFeatureAccess, getFeatureFlagValue } from "@repo/billing";
import { enforceFeatureTier } from "../enforce-feature-tier";

const mockHasFeatureAccess = vi.mocked(hasFeatureAccess);
const mockGetFeatureFlagValue = vi.mocked(getFeatureFlagValue);

const USER_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("enforceFeatureTier", () => {
  it("returns true regardless of tier when tier_enforcement_enabled is false", async () => {
    mockGetFeatureFlagValue.mockResolvedValue(false);
    mockHasFeatureAccess.mockResolvedValue(false);

    const result = await enforceFeatureTier(USER_ID, "memes:ai-caption");
    expect(result).toBe(true);
    expect(mockHasFeatureAccess).not.toHaveBeenCalled();
  });

  it("returns true regardless of tier when flag is unset (defaults to false)", async () => {
    mockGetFeatureFlagValue.mockResolvedValue(undefined as unknown as boolean);
    mockHasFeatureAccess.mockResolvedValue(false);

    const result = await enforceFeatureTier(USER_ID, "memes:ai-caption");
    expect(result).toBe(true);
  });

  it("delegates to hasFeatureAccess for memes:ai-caption when enforcement is on", async () => {
    mockGetFeatureFlagValue.mockResolvedValue(true);
    mockHasFeatureAccess.mockResolvedValue(false);

    const result = await enforceFeatureTier(USER_ID, "memes:ai-caption");
    expect(result).toBe(false);
    expect(mockHasFeatureAccess).toHaveBeenCalledWith(
      USER_ID,
      "memes:ai-caption",
    );
  });

  it("returns true for memes:ai-caption when user has access (pro/enterprise)", async () => {
    mockGetFeatureFlagValue.mockResolvedValue(true);
    mockHasFeatureAccess.mockResolvedValue(true);

    const result = await enforceFeatureTier(USER_ID, "memes:ai-caption");
    expect(result).toBe(true);
    expect(mockHasFeatureAccess).toHaveBeenCalledWith(
      USER_ID,
      "memes:ai-caption",
    );
  });
});
