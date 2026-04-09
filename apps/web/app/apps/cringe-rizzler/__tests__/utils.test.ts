import { describe, it, expect } from "vitest";
import { getRandomTerms } from "../lib/utils";
import { SLANG_MAP } from "../data/slang";

describe("getRandomTerms", () => {
  it("returns an array of the requested length", () => {
    const result = getRandomTerms(3);
    expect(result).toHaveLength(3);
  });

  it("returns only valid SLANG_MAP keys", () => {
    const validKeys = new Set(Object.keys(SLANG_MAP));
    const result = getRandomTerms(5);
    for (const term of result) {
      expect(validKeys.has(term)).toBe(true);
    }
  });

  it("returns unique terms (no duplicates)", () => {
    const result = getRandomTerms(10);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it("returns an empty array when count is 0", () => {
    expect(getRandomTerms(0)).toHaveLength(0);
  });

  it("returns all terms when count equals dictionary size", () => {
    const total = Object.keys(SLANG_MAP).length;
    const result = getRandomTerms(total);
    expect(result).toHaveLength(total);
    const unique = new Set(result);
    expect(unique.size).toBe(total);
  });

  it("returns different results on successive calls (randomness)", () => {
    const results = Array.from({ length: 5 }, () => getRandomTerms(3).join(","));
    const unique = new Set(results);
    // With 40 terms and picking 3, repeating all 5 times is astronomically unlikely
    expect(unique.size).toBeGreaterThan(1);
  });
});
