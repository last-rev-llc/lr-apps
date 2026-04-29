import { createClient } from "@repo/db/server";
import type { Idea } from "./types";

export async function getIdeas(): Promise<Idea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .neq("status", "archived")
    .order("compositeScore", { ascending: false, nullsFirst: false })
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("ideas fetch error:", error);
    return [];
  }

  return (data ?? []) as unknown as Idea[];
}
