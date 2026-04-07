import { createClient } from "@repo/db/server";
import type { SentimentEntry } from "./types";

export async function getSentimentEntries(): Promise<SentimentEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sentiment_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SentimentEntry[];
}
