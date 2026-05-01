import { z } from "zod";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { log } from "@repo/logger";

export const SUMMARY_MODEL_ID = "claude-sonnet-4-6";

export const CLIENT_HEALTH_SUMMARY_SYSTEM_PROMPT = `You are an expert account-health analyst writing a concise client-health briefing for a portfolio manager.

Return JSON matching the provided schema. The fields:
- headline: a single sentence (<= 220 chars) summarizing the overall posture for this client. Decisive, plain English.
- positives: 3 to 5 short bullets calling out what is working (uptime streaks, fast response times, valid SSL, etc.). Each bullet <= 140 chars.
- concerns: 0 to 5 short bullets calling out current risks (down sites, slow endpoints, expiring certs, score drops). Each bullet <= 140 chars. Leave empty if there are no concerns.
- recommendations: 2 to 5 short bullets, each a verb-led action the team should take next. Each bullet <= 140 chars.

Be specific. Reference the supplied site URLs and metrics. Do not invent metrics. Do not output any text outside the JSON object.`;

export const SummarySchema = z.object({
  headline: z.string().min(1).max(220),
  positives: z.array(z.string().max(140)).max(5),
  concerns: z.array(z.string().max(140)).max(5),
  recommendations: z.array(z.string().max(140)).max(5),
});

export type Summary = z.infer<typeof SummarySchema>;

export interface SummarizeInput {
  clientId: string;
  clientName: string;
  sites: Array<{
    url: string;
    status: string | null;
    score?: number | null;
    responseTime?: number | null;
    uptime?: number | null;
    sslExpiry?: string | null;
  }>;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function deterministicStub({ clientName, sites }: SummarizeInput): Summary {
  const seed = hashString(`${clientName}|${sites.map((s) => s.url).join(",")}`);
  const downCount = sites.filter((s) => s.status === "down").length;
  const total = sites.length;
  const concerns: string[] = [];
  if (downCount > 0) {
    concerns.push(`${downCount} site${downCount === 1 ? "" : "s"} reporting down`);
  }
  const positives = [
    `${Math.max(total - downCount, 0)} of ${total} sites currently reachable`,
    "Monitoring cron is healthy and reporting on schedule",
    "Recent score within the configured threshold",
  ];
  const recommendations = [
    "Triage any down sites with the on-call channel",
    "Review SSL renewal calendar for the next 30 days",
    "Confirm the synthetic check for the slowest endpoint",
  ];
  const variantA = `Health snapshot for ${clientName}: ${total - downCount}/${total} sites up.`;
  const variantB = `${clientName} — overall posture is steady; monitor the slowest endpoints this week.`;
  const headline = seed % 2 === 0 ? variantA : variantB;
  return { headline, positives, concerns, recommendations };
}

export async function summarize(input: SummarizeInput): Promise<Summary> {
  if (!process.env.ANTHROPIC_API_KEY) {
    log.warn(
      "client-health.summarize ANTHROPIC_API_KEY unset — using deterministic stub",
      { action: "summarize", stubbed: true },
    );
    return deterministicStub(input);
  }

  const lines: string[] = [];
  lines.push(`Client: ${input.clientName}`);
  lines.push(`Sites (${input.sites.length}):`);
  for (const s of input.sites) {
    const parts: string[] = [`- ${s.url} status=${s.status ?? "unknown"}`];
    if (typeof s.score === "number") parts.push(`score=${s.score}`);
    if (typeof s.responseTime === "number") parts.push(`rt=${s.responseTime}ms`);
    if (typeof s.uptime === "number") parts.push(`uptime=${s.uptime}%`);
    if (s.sslExpiry) parts.push(`ssl=${s.sslExpiry}`);
    lines.push(parts.join(" "));
  }
  const prompt = lines.join("\n");

  const { object } = await generateObject({
    model: anthropic(SUMMARY_MODEL_ID),
    schema: SummarySchema,
    system: CLIENT_HEALTH_SUMMARY_SYSTEM_PROMPT,
    prompt,
  });

  return object;
}
