import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { withSpan } from "@/lib/otel";
import { InsightsSchema } from "./schemas";
import type { Contact, ContactInsights } from "./types";

export const ENRICH_MODEL_ID = "claude-sonnet-4-6";

export const ENRICH_SYSTEM_PROMPT = `You are a relationship-intelligence analyst helping Adam Harris (founder of
Last Rev) prepare to communicate effectively with the people in his network.
Given the structured profile of one contact, infer how Adam should approach
them: how they communicate, what motivates them, what to talk about, and
what to avoid.

Rules:
- Ground every claim in evidence from the provided profile fields. Do not
  invent biographical facts (employment history, achievements, family).
- When a field cannot be confidently inferred, omit it rather than guess.
  Lower the \`confidence\` value accordingly ("high" only when title, company,
  notes, and at least one social handle are all present and coherent).
- Keep all string fields concise (one short sentence; no markdown).
- For \`interests.sharedWithAdam\`, only list things both clearly applicable to
  the contact AND likely to resonate with a technical founder running a
  consultancy/product studio. If unclear, return an empty array.
- \`topicsToAvoid\` should be evidence-based (e.g. "competitor of $employer")
  not generic warnings ("avoid politics").
- Never include private, sensitive, or speculative health/political/
  religious content.`;

function buildUserMessage(contact: Contact): string {
  const tags = contact.tags && contact.tags.length > 0 ? contact.tags.join(", ") : "(none)";
  return [
    "Contact profile:",
    `- Name: ${contact.name}`,
    `- Title: ${contact.title ?? "(unknown)"}`,
    `- Company: ${contact.company ?? "(unknown)"}`,
    `- Type: ${contact.type ?? "(unknown)"}`,
    `- Email: ${contact.email ?? "(none)"}`,
    `- Location / timezone: ${contact.location ?? "?"} / ${contact.timezone ?? "?"}`,
    `- LinkedIn: ${contact.linkedin_url ?? "(none)"}`,
    `- GitHub: ${contact.github_handle ?? "(none)"}`,
    `- Twitter/X: ${contact.twitter_handle ?? "(none)"}`,
    `- Slack: ${contact.slack_handle ?? "(none)"}`,
    `- Website: ${contact.website ?? "(none)"}`,
    `- Tags: ${tags}`,
    `- Existing notes: ${contact.notes ?? "(none)"}`,
    "",
    "Produce a ContactInsights object matching the provided schema. Be specific",
    "to this person — generic advice (\"be professional\", \"ask about their work\")",
    "should never appear.",
  ].join("\n");
}

export async function enrichContact(contact: Contact): Promise<ContactInsights> {
  return withSpan("crm.enrich", { contactId: contact.id }, async () => {
    const prompt = buildUserMessage(contact);
    const { object } = await generateObject({
      model: anthropic(ENRICH_MODEL_ID),
      schema: InsightsSchema,
      system: ENRICH_SYSTEM_PROMPT,
      prompt,
    });
    return object as ContactInsights;
  });
}
