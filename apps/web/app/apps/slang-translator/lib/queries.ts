import { createClient } from "@repo/db/server";
import type { SlangEntry } from "./types";
// Gen X data is a local copy of apps/slang-translator/data/gen-x-slang.json
import genXRaw from "../data/gen-x-slang.json";

// biome-ignore lint/suspicious/noExplicitAny: JSON shape
const genXData: SlangEntry[] = (genXRaw as any[]).map((s: any) => ({
  ...s,
  generation: "gen-x" as const,
  vibe_score: s.vibeScore ?? s.vibe_score ?? 0,
  vibeScore: s.vibeScore ?? s.vibe_score ?? 0,
  aliases: s.aliases ?? [],
}));

export async function getAllSlang(): Promise<SlangEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("slang")
    .select("*")
    .order("vibe_score", { ascending: false });

  if (error) throw error;

  const genAlpha: SlangEntry[] = ((data ?? []) as unknown[]).map(
    // biome-ignore lint/suspicious/noExplicitAny: Supabase row
    (r: any) => ({
      ...r,
      generation: "gen-alpha" as const,
      vibeScore: r.vibe_score ?? 0,
      aliases: r.aliases ?? [],
    })
  );

  // Merge gen-alpha (from DB) + gen-x (from local JSON), sorted by vibe_score desc
  const combined = [...genAlpha, ...genXData];
  combined.sort(
    (a, b) =>
      (b.vibe_score ?? b.vibeScore ?? 0) - (a.vibe_score ?? a.vibeScore ?? 0)
  );
  return combined;
}
