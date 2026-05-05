import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface ChatflowTarget {
  id: string;
  user_id: string;
  name: string;
  api_host: string;
  chatflow_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTargetInput {
  name: string;
  api_host: string;
  chatflow_id: string;
  api_token: string;
}

export interface UpdateTargetInput {
  name?: string;
  api_host?: string;
  chatflow_id?: string;
  api_token?: string;
}

const PUBLIC_PROJECTION =
  "id, user_id, name, api_host, chatflow_id, created_at, updated_at";

function serviceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "ai-eval target-store requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function activeKeyId(): string {
  const id = process.env.PGSODIUM_KEY_ID;
  if (!id) {
    throw new Error(
      "ai-eval target-store requires PGSODIUM_KEY_ID to encrypt new tokens",
    );
  }
  return id;
}

function unwrapRow(data: unknown): ChatflowTarget {
  // RPC functions defined in the migration return TABLE(...), so the SDK
  // surfaces an array of one row. Defensive against either shape so a future
  // single-row RPC swap doesn't break callers.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    throw new Error("chatflow target RPC returned no row");
  }
  return row as ChatflowTarget;
}

export async function createTarget(
  userId: string,
  input: CreateTargetInput,
): Promise<ChatflowTarget> {
  const supabase = serviceRoleClient();
  const { data, error } = await supabase.rpc("chatflow_targets_create", {
    p_user_id: userId,
    p_name: input.name,
    p_api_host: input.api_host,
    p_chatflow_id: input.chatflow_id,
    p_api_token: input.api_token,
    p_key_id: activeKeyId(),
  });
  if (error) {
    throw new Error(`chatflow_targets create failed: ${error.message}`);
  }
  return unwrapRow(data);
}

export async function getTarget(
  userId: string,
  id: string,
): Promise<ChatflowTarget | null> {
  const supabase = serviceRoleClient();
  const { data, error } = await supabase
    .from("chatflow_targets")
    .select(PUBLIC_PROJECTION)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`chatflow_targets get failed: ${error.message}`);
  }
  return (data as ChatflowTarget | null) ?? null;
}

export async function listTargets(userId: string): Promise<ChatflowTarget[]> {
  const supabase = serviceRoleClient();
  const { data, error } = await supabase
    .from("chatflow_targets")
    .select(PUBLIC_PROJECTION)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`chatflow_targets list failed: ${error.message}`);
  }
  return (data ?? []) as ChatflowTarget[];
}

export async function updateTarget(
  userId: string,
  id: string,
  input: UpdateTargetInput,
): Promise<ChatflowTarget> {
  const supabase = serviceRoleClient();
  const { data, error } = await supabase.rpc("chatflow_targets_update", {
    p_user_id: userId,
    p_id: id,
    p_name: input.name ?? null,
    p_api_host: input.api_host ?? null,
    p_chatflow_id: input.chatflow_id ?? null,
    p_api_token: input.api_token ?? null,
    p_key_id: input.api_token != null ? activeKeyId() : null,
  });
  if (error) {
    throw new Error(`chatflow_targets update failed: ${error.message}`);
  }
  return unwrapRow(data);
}

export async function deleteTarget(userId: string, id: string): Promise<void> {
  const supabase = serviceRoleClient();
  const { error } = await supabase
    .from("chatflow_targets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw new Error(`chatflow_targets delete failed: ${error.message}`);
  }
}

export async function decryptTokenForOutboundCall(
  userId: string,
  id: string,
): Promise<string> {
  const supabase = serviceRoleClient();
  const { data, error } = await supabase.rpc(
    "chatflow_targets_decrypt_token",
    { p_user_id: userId, p_id: id },
  );
  if (error) {
    // The RPC raises on user mismatch / not-found. Rewrap so callers get a
    // typed Error and the original message bubbles up. Postgres errors do not
    // include the plaintext, so this is safe to surface.
    throw new Error(`chatflow_targets decrypt failed: ${error.message}`);
  }
  if (typeof data !== "string" || data.length === 0) {
    // Defensive: never silently hand back empty plaintext.
    throw new Error(
      "chatflow_targets decrypt returned empty plaintext; refusing to proceed",
    );
  }
  return data;
}
