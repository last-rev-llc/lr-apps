import { createClient } from "@repo/db/server";
import type { Idea } from "./types";

// `tags` is jsonb in Postgres, so legacy/seed rows may hold a string or object
// instead of an array. Normalize at the boundary so UI consumers can rely on
// `tags` being a string[].
function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((t): t is string => typeof t === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export async function getIdeas(): Promise<Idea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .neq("status", "archived")
    .order("compositeScore", { ascending: false, nullsFirst: false })
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("ideas fetch error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    tags: normalizeTags((row as { tags?: unknown }).tags),
  })) as unknown as Idea[];
}
