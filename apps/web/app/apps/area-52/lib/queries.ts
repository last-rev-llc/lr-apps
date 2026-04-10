import { createClient } from "@repo/db/server";
import type { Experiment } from "./types";

export async function getExperiments(): Promise<Experiment[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("area_52_experiments")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch experiments:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    category: row.category,
    owner: row.owner,
    outcome: row.outcome,
    links: row.links ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
