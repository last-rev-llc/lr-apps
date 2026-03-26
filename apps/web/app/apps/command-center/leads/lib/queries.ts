import { createClient } from "@repo/db/server";
import type { Lead } from "./types";

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

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("fitScore", { ascending: false });

  if (error) {
    console.error("leads fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as Lead[];

  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    raw["techStack"] = parseJsonField(raw["techStack"], {});
    raw["people"] = parseJsonField(raw["people"], []);
    raw["news"] = parseJsonField(raw["news"], []);
    raw["socialLinks"] = parseJsonField(raw["socialLinks"], {});
    raw["fitReasons"] = parseJsonField(raw["fitReasons"], []);
    raw["talkingPoints"] = parseJsonField(raw["talkingPoints"], []);
  });

  return rows;
}
