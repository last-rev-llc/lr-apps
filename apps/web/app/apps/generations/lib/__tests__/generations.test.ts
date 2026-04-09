import { describe, it, expect } from "vitest";
import { GENERATIONS, getGeneration, TRANSLATOR_MAPS } from "../generations";

describe("GENERATIONS", () => {
  it("has all 6 generation entries", () => {
    expect(GENERATIONS).toHaveLength(6);
  });

  it("each entry has all required fields", () => {
    for (const gen of GENERATIONS) {
      expect(gen.slug).toBeTruthy();
      expect(gen.name).toBeTruthy();
      expect(gen.era).toBeTruthy();
      expect(gen.color).toMatch(/^#/);
      expect(gen.emoji).toBeTruthy();
      expect(gen.tagline).toBeTruthy();
    }
  });

  it("slugs are unique", () => {
    const slugs = GENERATIONS.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("getGeneration", () => {
  it("returns config for valid slug", () => {
    const gen = getGeneration("gen-z");
    expect(gen).toBeDefined();
    expect(gen!.name).toBe("Gen Z");
    expect(gen!.era).toBe("1997–2012");
  });

  it("returns config for each generation slug", () => {
    for (const expected of GENERATIONS) {
      const result = getGeneration(expected.slug);
      expect(result).toEqual(expected);
    }
  });

  it("returns undefined for invalid slug", () => {
    expect(getGeneration("gen-omega")).toBeUndefined();
    expect(getGeneration("")).toBeUndefined();
  });
});

describe("TRANSLATOR_MAPS", () => {
  it("has an entry for each generation slug", () => {
    for (const gen of GENERATIONS) {
      expect(TRANSLATOR_MAPS[gen.slug]).toBeDefined();
      expect(Object.keys(TRANSLATOR_MAPS[gen.slug]!).length).toBeGreaterThan(0);
    }
  });

  it("maps contain string-to-string translations", () => {
    for (const [slug, map] of Object.entries(TRANSLATOR_MAPS)) {
      for (const [key, val] of Object.entries(map)) {
        expect(typeof key).toBe("string");
        expect(typeof val).toBe("string");
      }
    }
  });
});
