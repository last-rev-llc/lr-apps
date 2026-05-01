import { describe, it, expect } from "vitest";
import { quotaUpgradeCopyForTier, tierLabel } from "../lib/upgrade-copy";

describe("quotaUpgradeCopyForTier", () => {
  it("free tier — points users to Pro for 200 saves", () => {
    const copy = quotaUpgradeCopyForTier("free");
    expect(copy.description).toMatch(/Pro/);
    expect(copy.description).toMatch(/200/);
    expect(copy.ctaHref).toBeTruthy();
  });

  it("pro tier — points users to Enterprise for 500 saves", () => {
    const copy = quotaUpgradeCopyForTier("pro");
    expect(copy.description).toMatch(/Enterprise/);
    expect(copy.description).toMatch(/500/);
    expect(copy.ctaHref).toBeTruthy();
  });

  it("enterprise tier — no upgrade CTA", () => {
    const copy = quotaUpgradeCopyForTier("enterprise");
    expect(copy.title).toMatch(/Limit reached/i);
    expect(copy.ctaHref).toBeNull();
    expect(copy.ctaLabel).toBeNull();
  });
});

describe("tierLabel", () => {
  it("returns Free / Pro / Enterprise", () => {
    expect(tierLabel("free")).toBe("Free");
    expect(tierLabel("pro")).toBe("Pro");
    expect(tierLabel("enterprise")).toBe("Enterprise");
  });
});
