import { describe, it, expect } from "vitest";
import { FEATURE_LABELS, TIERS, TIER_ORDER } from "../tier-config";

describe("tier-config", () => {
  describe("FEATURE_LABELS", () => {
    it("registers client-health:ai-summary as pro", () => {
      expect(FEATURE_LABELS["client-health:ai-summary"]).toEqual({
        requiredTier: "pro",
        label: "AI client health summaries",
      });
    });

    it("registers client-health:alerting as pro", () => {
      expect(FEATURE_LABELS["client-health:alerting"]).toEqual({
        requiredTier: "pro",
        label: "Alert notifications & history",
      });
    });

    it("registers client-health:settings as pro", () => {
      expect(FEATURE_LABELS["client-health:settings"]).toEqual({
        requiredTier: "pro",
        label: "Alert preferences",
      });
    });

    it("retains the existing ideas:ai-plan entry", () => {
      expect(FEATURE_LABELS["ideas:ai-plan"]).toEqual({
        requiredTier: "pro",
        label: "AI idea planning & scoring",
      });
    });

    it("each feature label has a non-empty label string", () => {
      for (const [key, value] of Object.entries(FEATURE_LABELS)) {
        expect(value.label, `label for ${key}`).toBeTruthy();
        expect(typeof value.label).toBe("string");
      }
    });
  });

  describe("TIERS", () => {
    it("declares free, pro, and enterprise tiers", () => {
      expect(Object.keys(TIERS).sort()).toEqual([
        "enterprise",
        "free",
        "pro",
      ]);
    });
  });

  describe("TIER_ORDER", () => {
    it("orders tiers from free to enterprise", () => {
      expect(TIER_ORDER).toEqual(["free", "pro", "enterprise"]);
    });
  });
});
