import { createClient } from "@repo/db/server";
import type { ContentfulHealth } from "./types";

export async function getContentfulHealth(): Promise<ContentfulHealth[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contentful_health")
    .select("*")
    .order("space", { ascending: true });

  if (error) {
    console.error("contentful_health fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as ContentfulHealth[];
  rows.forEach((r) => {
    const raw = r as unknown as Record<string, unknown>;
    for (const field of ["staleDrafts", "recentPublishes"]) {
      if (typeof raw[field] === "string") {
        try {
          raw[field] = JSON.parse(raw[field] as string);
        } catch {
          raw[field] = [];
        }
      }
    }
  });
  return rows;
}
