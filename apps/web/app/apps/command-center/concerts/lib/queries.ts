import { createClient } from "@repo/db/server";
import type { Concert } from "./types";

export async function getConcerts(): Promise<Concert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("concerts")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("concerts fetch error:", error);
    return [];
  }

  return (data ?? []) as unknown as Concert[];
}
