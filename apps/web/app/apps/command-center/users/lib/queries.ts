import { createClient } from "@repo/db/server";
import type { Contact } from "./types";

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

export async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("contacts fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as Contact[];

  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    raw["tags"] = parseJsonField(raw["tags"], []);
    raw["insights"] = parseJsonField(raw["insights"], null);
  });

  return rows;
}
