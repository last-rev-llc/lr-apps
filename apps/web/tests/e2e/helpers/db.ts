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

export interface SeedIdeaInput {
  title: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  plan?: string | null;
  planModel?: string | null;
  planGeneratedAt?: string | null;
  feasibility?: number | null;
  impact?: number | null;
  effort?: "Low" | "Medium" | "High" | null;
  status?: "new" | "backlog" | "in-progress" | "completed" | "archived";
}

export async function seedIdea(
  userId: string,
  input: SeedIdeaInput,
): Promise<string> {
  const client = getServiceClient();
  const row: Record<string, unknown> = {
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    category: input.category ?? null,
    tags: input.tags ?? [],
    status: input.status ?? "new",
    source: "manual",
  };
  if (input.plan !== undefined) row.plan = input.plan;
  if (input.planModel !== undefined) row.planModel = input.planModel;
  if (input.planGeneratedAt !== undefined)
    row.planGeneratedAt = input.planGeneratedAt;
  if (input.feasibility !== undefined) row.feasibility = input.feasibility;
  if (input.impact !== undefined) row.impact = input.impact;
  if (input.effort !== undefined) row.effort = input.effort;

  const { data, error } = await client
    .from("ideas")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(`seedIdea failed: ${error.message}`);
  return data.id as string;
}

export async function deleteIdeasForUser(userId: string): Promise<void> {
  const client = getServiceClient();
  const { error } = await client
    .from("ideas")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(`deleteIdeasForUser failed: ${error.message}`);
}

export async function deleteIdea(id: string): Promise<void> {
  const client = getServiceClient();
  const { error } = await client.from("ideas").delete().eq("id", id);
  if (error) throw new Error(`deleteIdea failed: ${error.message}`);
}
