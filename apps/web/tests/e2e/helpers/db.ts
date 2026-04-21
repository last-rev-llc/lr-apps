import { createClient } from "@supabase/supabase-js";

type Permission = "view" | "edit" | "admin";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for E2E tests",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function seedPermission(
  userId: string,
  appSlug: string,
  permission: Permission,
): Promise<void> {
  const client = getServiceClient();
  const { error } = await client.from("app_permissions").upsert(
    { user_id: userId, app_slug: appSlug, permission },
    { onConflict: "user_id,app_slug" },
  );
  if (error) throw new Error(`seedPermission failed: ${error.message}`);
}

export async function deletePermission(
  userId: string,
  appSlug: string,
): Promise<void> {
  const client = getServiceClient();
  const { error } = await client
    .from("app_permissions")
    .delete()
    .eq("user_id", userId)
    .eq("app_slug", appSlug);
  if (error) throw new Error(`deletePermission failed: ${error.message}`);
}

export async function getPermission(
  userId: string,
  appSlug: string,
): Promise<Permission | null> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("app_permissions")
    .select("permission")
    .eq("user_id", userId)
    .eq("app_slug", appSlug)
    .maybeSingle();
  if (error) throw new Error(`getPermission failed: ${error.message}`);
  return (data?.permission as Permission) ?? null;
}
