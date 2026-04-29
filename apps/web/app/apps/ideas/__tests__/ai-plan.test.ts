import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((id: string) => ({ id })),
}));

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  IDEAS_PLANNER_SYSTEM_PROMPT,
  PLAN_MODEL_ID,
  PlanSchema,
  planIdea,
} from "../lib/ai-plan";

const mockedGenerateObject = vi.mocked(generateObject);
const mockedAnthropic = vi.mocked(anthropic);

const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  }
});

describe("ai-plan exports", () => {
  it("exports a system prompt that mentions the score range and Markdown plan length", () => {
    expect(IDEAS_PLANNER_SYSTEM_PROMPT).toMatch(/0-10/);
    expect(IDEAS_PLANNER_SYSTEM_PROMPT).toMatch(/5 to 10/);
    expect(IDEAS_PLANNER_SYSTEM_PROMPT.toLowerCase()).toContain("markdown");
    expect(IDEAS_PLANNER_SYSTEM_PROMPT).toContain("Low");
    expect(IDEAS_PLANNER_SYSTEM_PROMPT).toContain("Medium");
    expect(IDEAS_PLANNER_SYSTEM_PROMPT).toContain("High");
  });

  it("PlanSchema accepts a valid plan object", () => {
    const ok = PlanSchema.safeParse({
      feasibility: 7,
      impact: 8,
      effort: "Medium",
      plan: "1. step",
    });
    expect(ok.success).toBe(true);
  });

  it("PlanSchema rejects out-of-range scores and bad effort", () => {
    expect(
      PlanSchema.safeParse({
        feasibility: 11,
        impact: 5,
        effort: "Medium",
        plan: "x",
      }).success,
    ).toBe(false);
    expect(
      PlanSchema.safeParse({
        feasibility: 5,
        impact: 5,
        effort: "Trivial",
        plan: "x",
      }).success,
    ).toBe(false);
  });
});

describe("planIdea", () => {
  it("returns a deterministic stub when ANTHROPIC_API_KEY is unset", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const a = await planIdea({ title: "Build a thing", description: "x" });
    const b = await planIdea({ title: "Build a thing", description: "x" });
    expect(a).toEqual(b);
    expect(PlanSchema.safeParse(a).success).toBe(true);
    expect(mockedGenerateObject).not.toHaveBeenCalled();
  });

  it("calls generateObject with the anthropic model when ANTHROPIC_API_KEY is set", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    mockedGenerateObject.mockResolvedValueOnce({
      object: {
        feasibility: 6,
        impact: 6,
        effort: "Low",
        plan: "1. ship it",
      },
    } as Awaited<ReturnType<typeof generateObject>>);
    const result = await planIdea({
      title: "T",
      description: "D",
      category: "C",
    });
    expect(mockedAnthropic).toHaveBeenCalledWith(PLAN_MODEL_ID);
    expect(mockedGenerateObject).toHaveBeenCalledTimes(1);
    const callArgs = mockedGenerateObject.mock.calls[0][0] as {
      system: string;
      prompt: string;
    };
    expect(callArgs.system).toBe(IDEAS_PLANNER_SYSTEM_PROMPT);
    expect(callArgs.prompt).toContain("Title: T");
    expect(callArgs.prompt).toContain("Description: D");
    expect(callArgs.prompt).toContain("Category: C");
    expect(result.feasibility).toBe(6);
  });
});
