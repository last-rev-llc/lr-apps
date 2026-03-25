import { createClient } from "@repo/db/server";
import type { StandupDay } from "./types";

export async function getStandupDays(): Promise<StandupDay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("days")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Failed to fetch standup days:", error);
    return [];
  }

  // activities is stored as JSON in Supabase — parse if it comes back as a string
  return (data ?? []).map((row) => ({
    ...row,
    activities:
      typeof row.activities === "string"
        ? JSON.parse(row.activities)
        : (row.activities ?? []),
  })) as StandupDay[];
}
