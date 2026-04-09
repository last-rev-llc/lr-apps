import { describe, it, expect } from "vitest";
import { GEN_X_MAP } from "../gen-x-map";

describe("GEN_X_MAP", () => {
  it("has 43 entries", () => {
    expect(Object.keys(GEN_X_MAP)).toHaveLength(43);
  });

  it("maps skibidi to Gnarly / Radical", () => {
    expect(GEN_X_MAP.skibidi).toBe("Gnarly / Radical");
  });

  it("maps rizz to Game / Mack Daddy", () => {
    expect(GEN_X_MAP.rizz).toBe("Game / Mack Daddy");
  });

  it("maps bussin to Da Bomb / Phat", () => {
    expect(GEN_X_MAP.bussin).toBe("Da Bomb / Phat");
  });

  it("maps sus to Sketchy", () => {
    expect(GEN_X_MAP.sus).toBe("Sketchy");
  });

  it("maps yeet to Chuck / Hurl", () => {
    expect(GEN_X_MAP.yeet).toBe("Chuck / Hurl");
  });

  it("has all non-empty string values", () => {
    for (const [key, value] of Object.entries(GEN_X_MAP)) {
      expect(typeof value).toBe("string");
      expect(value.length, `GEN_X_MAP["${key}"] should be non-empty`).toBeGreaterThan(0);
    }
  });
});
