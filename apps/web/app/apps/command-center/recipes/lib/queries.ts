import { createClient } from "@repo/db/server";
import type { Recipe } from "./types";

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export async function getRecipes(): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("recipes fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as Recipe[];

  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;

    // Normalize name/title
    if (!raw["name"] && raw["title"]) raw["name"] = raw["title"];
    if (!raw["icon"]) raw["icon"] = "📄";
    if (!raw["type"]) raw["type"] = raw["category"] ?? "App";

    raw["tags"] = parseJsonField(raw["tags"], []);
    raw["integrations"] = parseJsonField(raw["integrations"], []);
    raw["skills"] = parseJsonField(raw["skills"], []);
  });

  return rows;
}
