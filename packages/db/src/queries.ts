import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Permission, AppPermission, SubscriptionRow } from "./types";
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheKeys,
  PERM_TTL_SECONDS,
  SUB_TTL_SECONDS,
} from "./cache";

export async function getAppPermission(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<Permission | null> {
  const cacheKey = cacheKeys.permission(userId, slug);
  const cached = await cacheGet<{ permission: Permission | null }>(cacheKey);
  if (cached !== null) return cached.permission;

  const { data, error } = await client
    .from("app_permissions")
    .select("permission")
    .eq("user_id", userId)
    .eq("app_slug", slug)
    .maybeSingle<Pick<AppPermission, "permission">>();

  if (error) throw error;
  const permission = data?.permission ?? null;
  await cacheSet(cacheKey, { permission }, PERM_TTL_SECONDS);
  return permission;
}

export async function getUserSubscription(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<SubscriptionRow | null> {
  const cacheKey = cacheKeys.subscription(userId);
  const cached = await cacheGet<{ subscription: SubscriptionRow | null }>(cacheKey);
  if (cached !== null) return cached.subscription;

  const { data, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<SubscriptionRow>();

  if (error) throw error;
  await cacheSet(cacheKey, { subscription: data }, SUB_TTL_SECONDS);
  return data;
}

export async function upsertPermission(
  client: SupabaseClient<Database>,
  userId: string,
  appSlug: string,
  permission: Permission,
): Promise<AppPermission> {
  const payload: Database["public"]["Tables"]["app_permissions"]["Insert"] = {
    user_id: userId,
    app_slug: appSlug,
    permission,
  };
  const { data, error } = await client
    .from("app_permissions")
    .upsert(payload, { onConflict: "user_id,app_slug" })
    .select()
    .single<AppPermission>();

  if (error) throw error;
  await cacheDel([cacheKeys.permission(userId, appSlug)]);
  return data;
}
