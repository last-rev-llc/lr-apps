import { createClient } from "@repo/db/server";
import type { Agent } from "./types";

export async function getAgents(): Promise<Agent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("agents fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as Agent[];
  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    if (typeof raw["config"] === "string") {
      try {
        raw["config"] = JSON.parse(raw["config"] as string);
      } catch {
        raw["config"] = {};
      }
    }
  });

  return rows;
}
