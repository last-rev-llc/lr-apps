import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((id: string) => ({ id })),
}));

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  ENRICH_MODEL_ID,
  ENRICH_SYSTEM_PROMPT,
  enrichContact,
} from "../lib/enrich";
import type { Contact, ContactInsights } from "../lib/types";

const mockedGenerateObject = vi.mocked(generateObject);
const mockedAnthropic = vi.mocked(anthropic);

const baseContact: Contact = {
  id: "c1",
  name: "Jane Doe",
  title: "VP Engineering",
  company: "Acme",
  type: "client",
  email: "jane@acme.com",
  location: "Brooklyn",
  timezone: "America/New_York",
  linkedin_url: "https://www.linkedin.com/in/jane",
  github_handle: "janed",
  twitter_handle: "jdoe",
  slack_handle: "jane",
  website: "https://acme.com",
  tags: ["VIP", "design-systems"],
  notes: "Met at conference; runs platform team.",
};

const insights: ContactInsights = {
  confidence: "high",
  summary: "VP Engineering at a major client.",
  bestApproach: "Lead with concrete platform examples.",
  communicationStyle: {
    formality: "professional",
    tone: "warm",
    responseSpeed: "within 24h",
    preferredChannel: "email",
  },
  personality: {
    decisionStyle: "data-driven",
    detailOrientation: "high",
    conflictStyle: "direct",
    motivators: ["impact"],
    stressors: [],
  },
  interests: {
    professional: ["design systems"],
    personal: [],
    sharedWithAdam: ["consultancy"],
  },
  conversationStarters: ["How is platform team structured?"],
  topicsToAvoid: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedGenerateObject.mockResolvedValue({
    object: insights,
  } as unknown as Awaited<ReturnType<typeof generateObject>>);
});

describe("enrich exports", () => {
  it("uses claude-sonnet-4-6", () => {
    expect(ENRICH_MODEL_ID).toBe("claude-sonnet-4-6");
  });

  it("system prompt mentions Adam Harris and Last Rev", () => {
    expect(ENRICH_SYSTEM_PROMPT).toContain("Adam Harris");
    expect(ENRICH_SYSTEM_PROMPT).toContain("Last Rev");
  });

  it("system prompt has evidence-only rule and no private/sensitive content rule", () => {
    expect(ENRICH_SYSTEM_PROMPT.toLowerCase()).toContain("evidence");
    expect(ENRICH_SYSTEM_PROMPT.toLowerCase()).toContain("private");
  });
});

describe("enrichContact", () => {
  it("calls anthropic with the model and returns the parsed object", async () => {
    const out = await enrichContact(baseContact);
    expect(mockedAnthropic).toHaveBeenCalledWith(ENRICH_MODEL_ID);
    expect(mockedGenerateObject).toHaveBeenCalledTimes(1);
    expect(out).toEqual(insights);
  });

  it("templates each contact field into the prompt", async () => {
    await enrichContact(baseContact);
    const call = mockedGenerateObject.mock.calls[0]?.[0] as {
      prompt: string;
      system: string;
    };
    expect(call.system).toBe(ENRICH_SYSTEM_PROMPT);
    expect(call.prompt).toContain("Name: Jane Doe");
    expect(call.prompt).toContain("Title: VP Engineering");
    expect(call.prompt).toContain("Company: Acme");
    expect(call.prompt).toContain("Type: client");
    expect(call.prompt).toContain("Email: jane@acme.com");
    expect(call.prompt).toContain("LinkedIn: https://www.linkedin.com/in/jane");
    expect(call.prompt).toContain("GitHub: janed");
    expect(call.prompt).toContain("Twitter/X: jdoe");
    expect(call.prompt).toContain("Slack: jane");
    expect(call.prompt).toContain("Website: https://acme.com");
    expect(call.prompt).toContain("Tags: VIP, design-systems");
    expect(call.prompt).toContain("Existing notes: Met at conference");
  });

  it("renders missing fields as (unknown)/(none)/?", async () => {
    await enrichContact({ id: "c2", name: "Solo" });
    const call = mockedGenerateObject.mock.calls[0]?.[0] as { prompt: string };
    expect(call.prompt).toContain("Title: (unknown)");
    expect(call.prompt).toContain("Company: (unknown)");
    expect(call.prompt).toContain("Type: (unknown)");
    expect(call.prompt).toContain("Email: (none)");
    expect(call.prompt).toContain("Location / timezone: ? / ?");
    expect(call.prompt).toContain("LinkedIn: (none)");
    expect(call.prompt).toContain("Tags: (none)");
    expect(call.prompt).toContain("Existing notes: (none)");
  });

  it("propagates errors from the AI SDK", async () => {
    mockedGenerateObject.mockRejectedValueOnce(new Error("ai-sdk down"));
    await expect(enrichContact(baseContact)).rejects.toThrow("ai-sdk down");
  });
});
