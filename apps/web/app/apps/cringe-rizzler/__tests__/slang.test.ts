import { describe, it, expect } from "vitest";
import { SLANG_GLOSSARY, SLANG_MAP, CATEGORIES } from "../data/slang";

describe("SLANG_GLOSSARY", () => {
  it("has 40 items", () => {
    expect(SLANG_GLOSSARY).toHaveLength(40);
  });

  it("every item has required fields", () => {
    for (const item of SLANG_GLOSSARY) {
      expect(typeof item.term).toBe("string");
      expect(item.term.length).toBeGreaterThan(0);
      expect(typeof item.definition).toBe("string");
      expect(item.definition.length).toBeGreaterThan(0);
      expect(typeof item.category).toBe("string");
      expect(item.category.length).toBeGreaterThan(0);
      expect(typeof item.vibeScore).toBe("number");
      expect(item.vibeScore).toBeGreaterThanOrEqual(1);
      expect(item.vibeScore).toBeLessThanOrEqual(10);
    }
  });

  it("all terms are unique", () => {
    const terms = SLANG_GLOSSARY.map((s) => s.term);
    const unique = new Set(terms);
    expect(unique.size).toBe(terms.length);
  });
});

describe("SLANG_MAP", () => {
  it("keys match SLANG_GLOSSARY terms", () => {
    const glossaryTerms = new Set(SLANG_GLOSSARY.map((s) => s.term));
    const mapKeys = new Set(Object.keys(SLANG_MAP));
    expect(mapKeys).toEqual(glossaryTerms);
  });

  it("values match SLANG_GLOSSARY definitions", () => {
    for (const item of SLANG_GLOSSARY) {
      expect(SLANG_MAP[item.term]).toBe(item.definition);
    }
  });

  it("has the same count as SLANG_GLOSSARY", () => {
    expect(Object.keys(SLANG_MAP)).toHaveLength(SLANG_GLOSSARY.length);
  });
});

describe("CATEGORIES", () => {
  it("includes 'all' as the first entry", () => {
    expect(CATEGORIES[0]).toBe("all");
  });

  it("includes all unique categories from SLANG_GLOSSARY", () => {
    const glossaryCategories = new Set(SLANG_GLOSSARY.map((s) => s.category));
    for (const cat of glossaryCategories) {
      expect(CATEGORIES).toContain(cat);
    }
  });

  it("has no duplicate entries", () => {
    const unique = new Set(CATEGORIES);
    expect(unique.size).toBe(CATEGORIES.length);
  });
});
