import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { generatePhrase, generateMemeCaption } from "../actions";

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no API key
  delete process.env.OPENAI_API_KEY;
});

describe("generatePhrase", () => {
  it("returns a fallback phrase when no API key is set", async () => {
    const result = await generatePhrase(["rizz", "sigma", "bussin"]);
    expect(result.text).toBeTruthy();
    expect(typeof result.text).toBe("string");
    expect(result.terms).toHaveLength(3);
    expect(result.terms[0]).toEqual({ term: "rizz", def: expect.any(String) });
  });

  it("returns term definitions from SLANG_MAP", async () => {
    const result = await generatePhrase(["no cap", "fr fr"]);
    expect(result.terms).toEqual([
      { term: "no cap", def: "No lie, for real" },
      { term: "fr fr", def: "For real for real — emphasis on truthfulness" },
    ]);
  });

  it("handles unknown terms with empty def", async () => {
    const result = await generatePhrase(["nonexistent"]);
    expect(result.terms[0]).toEqual({ term: "nonexistent", def: "" });
  });

  it("calls OpenAI API when API key is set", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        choices: [{ message: { content: "This brisket is giving sigma rizz" } }],
      }),
    });

    const result = await generatePhrase(["sigma", "rizz"]);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result.text).toBe("This brisket is giving sigma rizz");
    expect(result.terms).toHaveLength(2);
  });

  it("throws when API returns no content", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ choices: [{ message: { content: null } }] }),
    });

    await expect(generatePhrase(["rizz"])).rejects.toThrow("No phrase generated");
  });
});

describe("generateMemeCaption", () => {
  it("returns fallback caption when no API key is set", async () => {
    const result = await generateMemeCaption("texting my kids", ["bussin"]);
    expect(result).toEqual({
      topText: "WHEN DAD SAYS BUSSIN",
      bottomText: "NO CAP FR FR",
    });
  });

  it("calls OpenAI API when API key is set", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        choices: [{ message: { content: "WHEN DAD TRIES RIZZ\nIT WAS NOT BUSSIN" } }],
      }),
    });

    const result = await generateMemeCaption("family dinner", ["rizz", "bussin"]);
    expect(result.topText).toBe("WHEN DAD TRIES RIZZ");
    expect(result.bottomText).toBe("IT WAS NOT BUSSIN");
  });

  it("uses defaults when API returns empty content", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ choices: [{ message: { content: null } }] }),
    });

    const result = await generateMemeCaption("office meeting", ["sigma"]);
    expect(result.topText).toBe("WHEN THE DAD SAYS BUSSIN");
    expect(result.bottomText).toBe("NO CAP FR FR");
  });

  it("handles single-line API response", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        choices: [{ message: { content: "ONLY TOP LINE" } }],
      }),
    });

    const result = await generateMemeCaption("BBQ", ["goat"]);
    expect(result.topText).toBe("ONLY TOP LINE");
    expect(result.bottomText).toBe("NO CAP FR FR");
  });
});
