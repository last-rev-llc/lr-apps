import { describe, it, expect } from "vitest";
import { getRandomTerms } from "../utils";
import { SLANG_MAP } from "../../data/slang";

describe("getRandomTerms", () => {
  it("returns the requested number of terms", () => {
    const terms = getRandomTerms(3);
    expect(terms).toHaveLength(3);
  });

  it("returns unique terms", () => {
    const terms = getRandomTerms(5);
    expect(new Set(terms).size).toBe(5);
  });

  it("returns terms that exist in SLANG_MAP", () => {
    const keys = Object.keys(SLANG_MAP);
    const terms = getRandomTerms(4);
    for (const t of terms) {
      expect(keys).toContain(t);
    }
  });

  it("returns empty array for count 0", () => {
    expect(getRandomTerms(0)).toHaveLength(0);
  });

  it("handles count exceeding total terms", () => {
    const total = Object.keys(SLANG_MAP).length;
    const terms = getRandomTerms(total + 10);
    expect(terms).toHaveLength(total);
  });

  it("returns 1 term when count is 1", () => {
    const terms = getRandomTerms(1);
    expect(terms).toHaveLength(1);
    expect(typeof terms[0]).toBe("string");
  });
});
