import { z } from "zod";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { log } from "@repo/logger";

export const PLAN_MODEL_ID = "claude-sonnet-4-6";

export const IDEAS_PLANNER_SYSTEM_PROMPT = `You are an expert product planner scoring and decomposing a single idea.

Return JSON matching the provided schema. The fields:
- feasibility: integer 0-10. How realistic is delivery with reasonable effort and existing tech (0 = impossible, 10 = trivial).
- impact: integer 0-10. Expected value to the user/business if shipped (0 = none, 10 = transformative).
- effort: one of "Low", "Medium", "High". The order-of-magnitude build cost (Low = days, Medium = weeks, High = months).
- plan: a Markdown action plan with 5 to 10 numbered steps. Each step is a concrete, verb-led action a builder can start tomorrow. Use Markdown lists, bold for emphasis, and avoid editorializing or restating the idea.

Be decisive. Do not output any text outside the JSON object.`;

export const PlanSchema = z.object({
  feasibility: z.number().int().min(0).max(10),
  impact: z.number().int().min(0).max(10),
  effort: z.enum(["Low", "Medium", "High"]),
  plan: z.string(),
});

export type Plan = z.infer<typeof PlanSchema>;

export interface PlanIdeaInput {
  title: string;
  description?: string | null;
  category?: string | null;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function deterministicStub({ title, description, category }: PlanIdeaInput): Plan {
  const seed = hashString(`${title}|${description ?? ""}|${category ?? ""}`);
  const feasibility = (seed % 11) as number;
  const impact = ((seed >> 4) % 11) as number;
  const efforts = ["Low", "Medium", "High"] as const;
  const effort = efforts[(seed >> 8) % 3];
  const plan = [
    `# Plan for ${title}`,
    "",
    "1. **Clarify the goal** — write a one-sentence problem statement and the success metric.",
    "2. **Sketch the user flow** — list the screens or steps a user takes from entry to outcome.",
    "3. **Identify constraints** — capture data, integrations, and policy requirements.",
    "4. **Build a vertical slice** — ship the smallest path that exercises every layer end-to-end.",
    "5. **Instrument** — log the key event so you can tell whether anyone uses it.",
    "6. **Gather feedback** — share with three target users and capture their reactions verbatim.",
    "7. **Decide next** — keep, pivot, or kill based on the metric and feedback.",
  ].join("\n");
  return { feasibility, impact, effort, plan };
}

export async function planIdea(input: PlanIdeaInput): Promise<Plan> {
  if (!process.env.ANTHROPIC_API_KEY) {
    log.warn("ideas.planIdea ANTHROPIC_API_KEY unset — using deterministic stub", {
      action: "planIdea",
      stubbed: true,
    });
    return deterministicStub(input);
  }

  const promptParts = [`Title: ${input.title}`];
  if (input.description) promptParts.push(`Description: ${input.description}`);
  if (input.category) promptParts.push(`Category: ${input.category}`);
  const prompt = promptParts.join("\n\n");

  const { object } = await generateObject({
    model: anthropic(PLAN_MODEL_ID),
    schema: PlanSchema,
    system: IDEAS_PLANNER_SYSTEM_PROMPT,
    prompt,
  });

  return object;
}
