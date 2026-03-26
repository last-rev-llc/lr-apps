import { createClient } from "@repo/db/server";
import type { MediaItem } from "./types";

function parseTagsField(value: unknown): string[] {
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

export async function getMediaItems(): Promise<MediaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("created", { ascending: false });

  if (error) {
    console.error("gallery fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as MediaItem[];
  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    raw["tags"] = parseTagsField(raw["tags"]);
  });

  return rows;
}
