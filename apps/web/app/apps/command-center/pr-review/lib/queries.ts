import { createClient } from "@repo/db/server";
import type { PR } from "./types";

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as string[];
    } catch {
      return [];
    }
  }
  return [];
}

export async function getPRs(): Promise<PR[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("pr-review fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as PR[];
  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    raw["labels"] = parseJsonArray(raw["labels"]);
    raw["reviewers"] = parseJsonArray(raw["reviewers"]);
  });

  return rows;
}
