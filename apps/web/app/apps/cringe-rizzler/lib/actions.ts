"use server";

import { SLANG_MAP } from "../data/slang";

// Local fallback phrases when no API key
const FALLBACK_PHRASES = [
  "This brisket is giving sigma rizz no cap fr fr.",
  "Bestie, your aura is totally bussin today, no cap!",
  "I understood the assignment at the grocery store — the sale items were goated.",
  "Let him cook, son. Dad's fanum tax on your fries is W behavior.",
  "That sunset is mid but my drip is bussin periodt.",
  "My PowerPoint presentation slayed so hard it caught them in 4k.",
  "We don't simp for overpriced avocado toast — that's L behavior, bet.",
  "I was the main character at the neighborhood BBQ, no cap fr fr.",
];

export async function generatePhrase(chosenTerms: string[]): Promise<{
  text: string;
  terms: Array<{ term: string; def: string }>;
}> {
  const terms = chosenTerms.map((t) => ({ term: t, def: SLANG_MAP[t] ?? "" }));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: return a canned phrase
    const phrase = FALLBACK_PHRASES[Math.floor(Math.random() * FALLBACK_PHRASES.length)];
    return { text: phrase, terms };
  }

  const slangList = chosenTerms.map((t) => `"${t}" (${SLANG_MAP[t]})`).join(", ");

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate hilariously cringeworthy phrases that a Gen X dad or Boomer would say while badly misusing Gen Alpha slang. The humor comes from the mismatch — like a dad at a BBQ saying \"this brisket is giving sigma rizz, no cap fr fr.\" Keep it PG, keep it short (1-2 sentences max), and make it painfully funny. Just return the phrase, nothing else.",
        },
        {
          role: "user",
          content: `Generate a cringe phrase using these Gen Alpha terms: ${slangList}. The speaker is a middle-aged parent trying way too hard to be cool.`,
        },
      ],
      max_tokens: 150,
      temperature: 1,
    }),
  });

  const data = await resp.json();
  const phrase = data.choices?.[0]?.message?.content?.trim();
  if (!phrase) {
    throw new Error("No phrase generated");
  }

  return { text: phrase, terms };
}

export async function generateMemeCaption(scenario: string, chosenTerms: string[]): Promise<{
  topText: string;
  bottomText: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { topText: "WHEN DAD SAYS BUSSIN", bottomText: "NO CAP FR FR" };
  }

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Generate a short, funny meme caption for a Gen X parent badly using Gen Alpha slang. Return ONLY two lines separated by a newline: the top text on line 1 and bottom text on line 2. Keep each line under 8 words. Classic meme format.",
        },
        {
          role: "user",
          content: `Scenario: "${scenario}". Use slang: ${chosenTerms.join(", ")}`,
        },
      ],
      max_tokens: 60,
      temperature: 1,
    }),
  });

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "WHEN THE DAD SAYS BUSSIN\nNO CAP FR FR";
  const lines = raw.split("\n").map((l: string) => l.trim()).filter(Boolean);
  return {
    topText: lines[0] ?? "WHEN THE DAD SAYS BUSSIN",
    bottomText: lines[1] ?? "NO CAP FR FR",
  };
}

