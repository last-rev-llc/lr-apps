import { createClient } from "@repo/db/server";
import type { TeamUsfMember } from "./types";

export async function getTeamUsfMembers(): Promise<TeamUsfMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_usf")
    .select("*")
    .order("role", { ascending: true });

  if (error) {
    console.error("team_usf fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as TeamUsfMember[];
  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    if (typeof raw["stats"] === "string") {
      try { raw["stats"] = JSON.parse(raw["stats"] as string); } catch { raw["stats"] = {}; }
    }
  });
  return rows;
}
