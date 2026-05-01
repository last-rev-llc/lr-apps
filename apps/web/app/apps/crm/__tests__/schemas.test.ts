import { describe, it, expect } from "vitest";
import {
  ContactInputSchema,
  ContactTypeEnum,
  InsightsSchema,
  type ContactInput,
} from "../lib/schemas";

describe("ContactInputSchema", () => {
  it("requires a non-empty name", () => {
    expect(ContactInputSchema.safeParse({ name: "" }).success).toBe(false);
    expect(ContactInputSchema.safeParse({}).success).toBe(false);
    expect(ContactInputSchema.safeParse({ name: "Adam" }).success).toBe(true);
  });

  it("trims the name", () => {
    const parsed = ContactInputSchema.parse({ name: "  Adam  " });
    expect(parsed.name).toBe("Adam");
  });

  it("accepts all writable contact fields", () => {
    const input: ContactInput = {
      name: "Adam Harris",
      email: "adam@lastrev.com",
      phone: "+1-555-0100",
      title: "Founder",
      company: "Last Rev",
      type: "team",
      avatar: null,
      location: "Brooklyn",
      timezone: "America/New_York",
      slack_id: "U123",
      slack_handle: "adam",
      github_handle: "aharris",
      linkedin_url: "https://www.linkedin.com/in/adam",
      twitter_handle: "adamh",
      website: "https://lastrev.com",
      tags: ["founder", "tech"],
      notes: "Existing relationship",
    };
    expect(ContactInputSchema.safeParse(input).success).toBe(true);
  });

  it("constrains type to the same values as the DB check constraint", () => {
    const valid = [
      "team",
      "client",
      "prospect",
      "partner",
      "vendor",
      "contractor",
      "personal",
      "other",
    ];
    for (const t of valid) {
      expect(ContactTypeEnum.safeParse(t).success).toBe(true);
    }
    expect(ContactTypeEnum.safeParse("ceo").success).toBe(false);
  });

  it("rejects malformed urls and emails", () => {
    expect(
      ContactInputSchema.safeParse({ name: "X", email: "not-an-email" }).success,
    ).toBe(false);
    expect(
      ContactInputSchema.safeParse({ name: "X", linkedin_url: "linkedin.com" })
        .success,
    ).toBe(false);
    expect(
      ContactInputSchema.safeParse({ name: "X", website: "lastrev" }).success,
    ).toBe(false);
  });

  it("treats optional fields as nullable + omittable", () => {
    expect(
      ContactInputSchema.safeParse({ name: "X", email: null }).success,
    ).toBe(true);
    expect(ContactInputSchema.safeParse({ name: "X" }).success).toBe(true);
  });

  it("partial() allows updating a single field", () => {
    expect(
      ContactInputSchema.partial().safeParse({ company: "Last Rev" }).success,
    ).toBe(true);
  });
});

describe("InsightsSchema", () => {
  const validInsights = {
    confidence: "high" as const,
    summary: "Founder of a focused product studio.",
    bestApproach: "Lead with concrete examples and clear timelines.",
    communicationStyle: {
      formality: "casual",
      tone: "warm",
      responseSpeed: "fast",
      preferredChannel: "slack",
    },
    personality: {
      decisionStyle: "decisive",
      detailOrientation: "high",
      conflictStyle: "direct",
      motivators: ["impact", "craft"],
      stressors: ["bureaucracy"],
    },
    interests: {
      professional: ["typescript", "product"],
      personal: ["music"],
      sharedWithAdam: ["consulting", "design systems"],
    },
    conversationStarters: ["What's on the roadmap?"],
    topicsToAvoid: [],
  };

  it("accepts the canonical shape", () => {
    expect(InsightsSchema.safeParse(validInsights).success).toBe(true);
  });

  it("constrains confidence to high/medium/low", () => {
    const bad = { ...validInsights, confidence: "great" };
    expect(InsightsSchema.safeParse(bad).success).toBe(false);
  });

  it("caps summary at 280 chars", () => {
    const bad = { ...validInsights, summary: "x".repeat(281) };
    expect(InsightsSchema.safeParse(bad).success).toBe(false);
  });

  it("caps bestApproach at 280 chars", () => {
    const bad = { ...validInsights, bestApproach: "y".repeat(281) };
    expect(InsightsSchema.safeParse(bad).success).toBe(false);
  });

  it("requires summary and bestApproach to be non-empty", () => {
    expect(
      InsightsSchema.safeParse({ ...validInsights, summary: "" }).success,
    ).toBe(false);
    expect(
      InsightsSchema.safeParse({ ...validInsights, bestApproach: "" })
        .success,
    ).toBe(false);
  });

  it("limits motivators and stressors to 6 entries each", () => {
    const tooMany = Array.from({ length: 7 }, (_, i) => `m${i}`);
    expect(
      InsightsSchema.safeParse({
        ...validInsights,
        personality: { ...validInsights.personality, motivators: tooMany },
      }).success,
    ).toBe(false);
    expect(
      InsightsSchema.safeParse({
        ...validInsights,
        personality: { ...validInsights.personality, stressors: tooMany },
      }).success,
    ).toBe(false);
  });

  it("limits professional/personal interests to 8 and shared to 6", () => {
    const tooManyEight = Array.from({ length: 9 }, (_, i) => `i${i}`);
    const tooManySix = Array.from({ length: 7 }, (_, i) => `s${i}`);
    expect(
      InsightsSchema.safeParse({
        ...validInsights,
        interests: { ...validInsights.interests, professional: tooManyEight },
      }).success,
    ).toBe(false);
    expect(
      InsightsSchema.safeParse({
        ...validInsights,
        interests: { ...validInsights.interests, personal: tooManyEight },
      }).success,
    ).toBe(false);
    expect(
      InsightsSchema.safeParse({
        ...validInsights,
        interests: { ...validInsights.interests, sharedWithAdam: tooManySix },
      }).success,
    ).toBe(false);
  });

  it("limits conversationStarters and topicsToAvoid to 6", () => {
    const seven = Array.from({ length: 7 }, (_, i) => `c${i}`);
    expect(
      InsightsSchema.safeParse({
        ...validInsights,
        conversationStarters: seven,
      }).success,
    ).toBe(false);
    expect(
      InsightsSchema.safeParse({ ...validInsights, topicsToAvoid: seven })
        .success,
    ).toBe(false);
  });

  it("allows null on each communicationStyle and personality string field", () => {
    const ok = {
      ...validInsights,
      communicationStyle: {
        formality: null,
        tone: null,
        responseSpeed: null,
        preferredChannel: null,
      },
      personality: {
        decisionStyle: null,
        detailOrientation: null,
        conflictStyle: null,
        motivators: [],
        stressors: [],
      },
    };
    expect(InsightsSchema.safeParse(ok).success).toBe(true);
  });
});
