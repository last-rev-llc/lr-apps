import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock the fetch global ──────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── Mock slang data ────────────────────────────────────────────────────────

vi.mock("../data/slang", () => ({
  SLANG_MAP: {
    rizz: "Charisma or charm, especially romantic",
    bussin: "Really good, especially food",
    sigma: "Independent, lone-wolf type personality",
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

describe("generatePhrase", () => {
  it("returns fallback phrase when OPENAI_API_KEY is absent", async () => {
    delete process.env.OPENAI_API_KEY;
    const { generatePhrase } = await import("../lib/actions");

    const result = await generatePhrase(["rizz", "bussin"]);

    expect(result).toHaveProperty("text");
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("terms");
    expect(Array.isArray(result.terms)).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns terms mapped from SLANG_MAP in fallback path", async () => {
    delete process.env.OPENAI_API_KEY;
    const { generatePhrase } = await import("../lib/actions");

    const result = await generatePhrase(["rizz", "bussin"]);

    expect(result.terms).toEqual([
      { term: "rizz", def: "Charisma or charm, especially romantic" },
      { term: "bussin", def: "Really good, especially food" },
    ]);
  });

  it("calls OpenAI API when OPENAI_API_KEY is set and returns phrase", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        choices: [{ message: { content: "This brisket is giving sigma rizz no cap." } }],
      }),
    });

    const { generatePhrase } = await import("../lib/actions");
    const result = await generatePhrase(["sigma"]);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      }),
    );
    expect(result.text).toBe("This brisket is giving sigma rizz no cap.");
    expect(result.terms).toEqual([{ term: "sigma", def: "Independent, lone-wolf type personality" }]);
  });

  it("throws when OpenAI returns no content", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ choices: [] }),
    });

    const { generatePhrase } = await import("../lib/actions");
    await expect(generatePhrase(["rizz"])).rejects.toThrow("No phrase generated");
  });
});

describe("generateMemeCaption", () => {
  it("returns fallback caption when OPENAI_API_KEY is absent", async () => {
    delete process.env.OPENAI_API_KEY;
    const { generateMemeCaption } = await import("../lib/actions");

    const result = await generateMemeCaption("family dinner", ["rizz"]);

    expect(result).toHaveProperty("topText");
    expect(result).toHaveProperty("bottomText");
    expect(typeof result.topText).toBe("string");
    expect(typeof result.bottomText).toBe("string");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls OpenAI and parses two-line response", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        choices: [{ message: { content: "WHEN DAD SAYS BUSSIN\nNO CAP FR FR" } }],
      }),
    });

    const { generateMemeCaption } = await import("../lib/actions");
    const result = await generateMemeCaption("texting my kids", ["bussin"]);

    expect(result.topText).toBe("WHEN DAD SAYS BUSSIN");
    expect(result.bottomText).toBe("NO CAP FR FR");
  });
});
