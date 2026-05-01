import { z } from "zod";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { log } from "@repo/logger";
import type { MemeTemplate } from "./types";

export const CAPTION_MODEL_ID = "claude-haiku-4-5";

export const MEME_CAPTION_SYSTEM_PROMPT = `You write punchy, internet-native meme captions.
Return JSON matching the provided schema. Each value is the caption for one zone (keyed by zone id).
Rules:
- Each caption MUST be 80 characters or fewer.
- Use ALL CAPS where the zone's uppercase flag is true.
- Be punchy and direct — no quotes, no narration, no restating the topic.
- Match the meme's panel structure suggested by the zone labels (top, bottom, panel-1, etc).
- Stay PG. No slurs, no harassment, no hate.

Output JSON only — no preface, no explanation.`;

const STUB_TOPS = [
  "WHEN YOU FINALLY",
  "ME TRYING TO",
  "NOBODY:",
  "NOT ME",
  "POV:",
];
const STUB_BOTTOMS = [
  "SHIP THE FEATURE",
  "EXPLAIN THE BUG",
  "FIX IT IN PROD",
  "RUN ONE MORE TEST",
  "MERGE THE PR",
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function deterministicCaption(
  topic: string,
  templateId: string,
  zoneId: string,
  zoneIndex: number,
): string {
  const seed = hashString(`${topic}|${templateId}|${zoneId}`);
  // Even-indexed zones pull from STUB_TOPS, odd-indexed from STUB_BOTTOMS.
  const pool = zoneIndex % 2 === 0 ? STUB_TOPS : STUB_BOTTOMS;
  return pool[seed % pool.length];
}

export interface GenerateCaptionInput {
  topic: string;
  template: MemeTemplate;
  style?: string;
}

export type CaptionMap = Record<string, string>;

function buildSchema(zoneIds: string[]): z.ZodType<CaptionMap> {
  const shape: Record<string, z.ZodString> = {};
  for (const id of zoneIds) {
    shape[id] = z.string().max(80);
  }
  return z.object(shape) as unknown as z.ZodType<CaptionMap>;
}

export async function generateCaption(
  input: GenerateCaptionInput,
): Promise<CaptionMap> {
  const zones = input.template.textZones;
  const zoneIds = zones.map((z) => z.id);

  if (!process.env.ANTHROPIC_API_KEY) {
    log.warn(
      "memeGenerator.generateCaption ANTHROPIC_API_KEY unset — using deterministic stub",
      {
        action: "generateCaption",
        stubbed: true,
        templateId: input.template.id,
      },
    );
    const out: CaptionMap = {};
    zones.forEach((zone, idx) => {
      out[zone.id] = deterministicCaption(
        input.topic,
        input.template.id,
        zone.id,
        idx,
      );
    });
    return out;
  }

  const schema = buildSchema(zoneIds);

  const promptParts = [
    `Topic: ${input.topic}`,
    `Template: ${input.template.name}`,
  ];
  if (input.style) promptParts.push(`Style: ${input.style}`);
  promptParts.push("Zones (return one short caption per zone id):");
  for (const zone of zones) {
    const upper = zone.uppercase ? " (ALL CAPS)" : "";
    promptParts.push(`  - ${zone.id} (${zone.label})${upper}`);
  }

  const { object } = await generateObject({
    model: anthropic(CAPTION_MODEL_ID),
    schema,
    system: MEME_CAPTION_SYSTEM_PROMPT,
    prompt: promptParts.join("\n"),
  });

  return object as CaptionMap;
}
