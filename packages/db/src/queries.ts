import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Permission, AppPermission, SubscriptionRow } from "./types";

export async function getAppPermission(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<Permission | null> {
  const { data, error } = await client
    .from("app_permissions")
    .select("permission")
    .eq("user_id", userId)
    .eq("app_slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data?.permission ?? null;
}

export async function getUserSubscription(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<SubscriptionRow | null> {
  const { data, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertPermission(
  client: SupabaseClient<Database>,
  userId: string,
  appSlug: string,
  permission: Permission,
): Promise<AppPermission> {
  const { data, error } = await client
    .from("app_permissions")
    .upsert(
      { user_id: userId, app_slug: appSlug, permission },
      { onConflict: "user_id,app_slug" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
