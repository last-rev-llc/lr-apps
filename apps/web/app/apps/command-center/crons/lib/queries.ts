import { createClient } from "@repo/db/server";
import type { Cron } from "./types";

export async function getCrons(): Promise<Cron[]> {
  const supabase = await createClient();

  // Try the `crons` table first, fall back to `cron_jobs`
  const { data, error } = await supabase
    .from("crons")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("crons fetch error:", error);

    // Fallback to cron_jobs table (legacy schema from cc-crons.js)
    const { data: fallback, error: fallbackError } = await supabase
      .from("cron_jobs")
      .select("*")
      .order("name", { ascending: true });

    if (fallbackError) {
      console.error("cron_jobs fallback fetch error:", fallbackError);
      return [];
    }

    return (fallback ?? []) as unknown as Cron[];
  }

  return (data ?? []) as unknown as Cron[];
}
