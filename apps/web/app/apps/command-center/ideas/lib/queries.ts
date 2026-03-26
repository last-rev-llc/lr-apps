import { createClient } from "@repo/db/server";
import type { Idea } from "./types";

export async function getIdeas(): Promise<Idea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("ideas fetch error:", error);
    return [];
  }

  // Parse JSON string fields that may come back as strings from Supabase
  const rows = (data ?? []) as unknown as Idea[];
  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    if (typeof raw["tags"] === "string") {
      try {
        raw["tags"] = JSON.parse(raw["tags"] as string);
      } catch {
        raw["tags"] = [];
      }
    }
    if (!raw["tags"]) raw["tags"] = [];
  });

  return rows;
}
