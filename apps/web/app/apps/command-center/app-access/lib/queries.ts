import { createClient } from "@repo/db/server";
import type { AppPermissionRow } from "./types";

export async function getAppPermissions(): Promise<AppPermissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_permissions")
    .select("*")
    .order("app_slug", { ascending: true });

  if (error) {
    console.error("app_permissions fetch error:", error);
    return [];
  }

  return (data ?? []) as unknown as AppPermissionRow[];
}
