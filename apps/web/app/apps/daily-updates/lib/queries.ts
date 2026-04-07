import { createClient } from "@repo/db/server";
import type { DailyUpdate, AppProfile } from "./types";

export async function getInitialUpdates(limit = 20): Promise<DailyUpdate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_updates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as DailyUpdate[];
}

export async function getSourceApps(): Promise<AppProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_update_profiles")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    // Table may not exist yet; fall back to deriving from updates
    return [];
  }
  return (data ?? []) as unknown as AppProfile[];
}

export async function getUniqueCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_updates")
    .select("category");

  const categories = new Set<string>();
  for (const row of (data ?? []) as unknown as { category?: string }[]) {
    if (row.category) categories.add(row.category);
  }
  return Array.from(categories).sort();
}
