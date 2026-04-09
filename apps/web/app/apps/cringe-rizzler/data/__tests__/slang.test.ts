import { describe, it, expect } from "vitest";
import { SLANG_GLOSSARY, SLANG_MAP, SCENARIOS, CATEGORIES } from "../slang";

describe("SLANG_GLOSSARY", () => {
  it("has all entries with required fields", () => {
    for (const entry of SLANG_GLOSSARY) {
      expect(entry.term).toBeTruthy();
      expect(entry.definition).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(typeof entry.vibeScore).toBe("number");
      expect(entry.vibeScore).toBeGreaterThanOrEqual(1);
      expect(entry.vibeScore).toBeLessThanOrEqual(10);
    }
  });

  it("contains expected number of entries", () => {
    expect(SLANG_GLOSSARY.length).toBe(40);
  });

  it("includes known terms", () => {
    const terms = SLANG_GLOSSARY.map((s) => s.term);
    expect(terms).toContain("rizz");
    expect(terms).toContain("sigma");
    expect(terms).toContain("bussin");
    expect(terms).toContain("goat");
  });
});

describe("SLANG_MAP", () => {
  it("has keys matching glossary terms", () => {
    const glossaryTerms = SLANG_GLOSSARY.map((s) => s.term).sort();
    const mapKeys = Object.keys(SLANG_MAP).sort();
    expect(mapKeys).toEqual(glossaryTerms);
  });

  it("maps terms to their definitions", () => {
    expect(SLANG_MAP["rizz"]).toBe("Charisma or charm, especially romantic");
    expect(SLANG_MAP["goat"]).toBe("Greatest of all time");
  });
});

describe("SCENARIOS", () => {
  it("is non-empty", () => {
    expect(SCENARIOS.length).toBeGreaterThan(0);
  });

  it("has 10 scenarios", () => {
    expect(SCENARIOS).toHaveLength(10);
  });

  it("contains known scenarios", () => {
    expect(SCENARIOS).toContain("texting my kids");
    expect(SCENARIOS).toContain("family dinner");
  });
});

describe("CATEGORIES", () => {
  it("starts with 'all'", () => {
    expect(CATEGORIES[0]).toBe("all");
  });

  it("contains categories derived from glossary", () => {
    const glossaryCats = new Set(SLANG_GLOSSARY.map((s) => s.category));
    for (const cat of CATEGORIES.slice(1)) {
      expect(glossaryCats.has(cat)).toBe(true);
    }
  });

  it("has sorted categories after 'all'", () => {
    const sorted = [...CATEGORIES.slice(1)].sort();
    expect(CATEGORIES.slice(1)).toEqual(sorted);
  });
});
