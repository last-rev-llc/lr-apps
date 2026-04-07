import { createClient } from "@repo/db/server";
import type { AiScript } from "./types";

export async function getAiScripts(): Promise<AiScript[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    // Table may not exist yet — return empty array, component falls back to static data
    console.error("scripts fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as AiScript[];
  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    if (typeof raw["tags"] === "string") {
      try { raw["tags"] = JSON.parse(raw["tags"] as string); } catch { raw["tags"] = []; }
    }
    if (!raw["tags"]) raw["tags"] = [];
  });
  return rows;
}
