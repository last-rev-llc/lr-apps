import { describe, it, expect } from "vitest";
import { GEN_X_MAP } from "../lib/gen-x-map";

describe("GEN_X_MAP", () => {
  it("is a non-empty record", () => {
    expect(typeof GEN_X_MAP).toBe("object");
    expect(Object.keys(GEN_X_MAP).length).toBeGreaterThan(0);
  });

  it("maps 'rizz' to a Gen X equivalent", () => {
    expect(GEN_X_MAP["rizz"]).toBeTruthy();
  });

  it("maps 'bussin' to a Gen X equivalent", () => {
    expect(GEN_X_MAP["bussin"]).toBeTruthy();
  });

  it("maps 'no-cap' to a Gen X equivalent", () => {
    expect(GEN_X_MAP["no-cap"]).toBeTruthy();
  });

  it("maps 'slay' to a Gen X equivalent", () => {
    expect(GEN_X_MAP["slay"]).toBeTruthy();
  });

  it("all values are non-empty strings", () => {
    for (const [key, val] of Object.entries(GEN_X_MAP)) {
      expect(typeof val).toBe("string");
      expect(val.length).toBeGreaterThan(0);
    }
  });
});
