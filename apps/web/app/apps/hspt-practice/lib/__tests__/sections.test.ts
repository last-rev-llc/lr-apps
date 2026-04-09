import { describe, it, expect } from "vitest";

// ── formatTime tests (exported via module internals) ────────────────────────
// formatTime is not exported directly, so we test it via behaviour expectations

describe("SECTIONS", () => {
  it("exports all five section keys", async () => {
    const { SECTIONS } = await import("../sections");
    expect(Object.keys(SECTIONS)).toEqual(
      expect.arrayContaining(["verbal", "quantitative", "reading", "mathematics", "language"])
    );
  });

  it("each section has required fields", async () => {
    const { SECTIONS } = await import("../sections");
    for (const [key, cfg] of Object.entries(SECTIONS)) {
      expect(cfg.name, `${key} missing name`).toBeTruthy();
      expect(cfg.icon, `${key} missing icon`).toBeTruthy();
      expect(cfg.time, `${key} missing time`).toBeGreaterThan(0);
      expect(cfg.count, `${key} missing count`).toBeGreaterThan(0);
      expect(cfg.types, `${key} missing types`).toBeInstanceOf(Array);
      expect(cfg.types.length, `${key} should have types`).toBeGreaterThan(0);
    }
  });

  it("verbal section has expected properties", async () => {
    const { SECTIONS } = await import("../sections");
    expect(SECTIONS.verbal.name).toBe("Verbal Skills");
    expect(SECTIONS.verbal.time).toBe(16);
    expect(SECTIONS.verbal.count).toBe(60);
  });

  it("mathematics section has the most time allocated", async () => {
    const { SECTIONS } = await import("../sections");
    const times = Object.values(SECTIONS).map((s) => s.time);
    expect(SECTIONS.mathematics.time).toBe(Math.max(...times));
  });
});
