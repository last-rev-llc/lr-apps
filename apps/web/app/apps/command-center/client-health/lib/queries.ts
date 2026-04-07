import { createClient } from "@repo/db/server";
import type { HealthSite } from "./types";

export async function getHealthSites(): Promise<HealthSite[]> {
  const supabase = await createClient();

  // Try uptime_sites first, fall back to client_health
  const { data, error } = await supabase
    .from("uptime_sites")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    // Try alternate table name
    const fallback = await supabase
      .from("client_health")
      .select("*")
      .order("name", { ascending: true });

    if (fallback.error) {
      console.error("client-health fetch error:", fallback.error);
      return [];
    }

    return (fallback.data ?? []) as unknown as HealthSite[];
  }

  return (data ?? []) as unknown as HealthSite[];
}
