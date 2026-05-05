import "server-only";

import { createServiceRoleClient } from "@repo/db/service-role";
import {
  ChatflowTargetInputSchema,
  TARGET_OUTPUT_COLUMNS,
  type ChatflowTargetInput,
  type ChatflowTargetOutput,
} from "./schema";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

let _clientFactory: () => ServiceClient = () => createServiceRoleClient();

/**
 * Test seam — overrides the Supabase service-role client. Production code
 * never calls this; the unit tests do.
 */
export function __setClientFactoryForTesting(factory: () => ServiceClient) {
  _clientFactory = factory;
}

function client(): ServiceClient {
  return _clientFactory();
}

function keyId(): string {
  const id = process.env.PGSODIUM_KEY_ID;
  if (!id) {
    throw new Error(
      "target-store: PGSODIUM_KEY_ID is required to read or write chatflow_targets",
    );
  }
  return id;
}

async function encryptToken(
  userId: string,
  plaintext: string,
): Promise<{ ciphertext: Uint8Array | string; key_id: string }> {
  const key_id = keyId();
  const supabase = client() as unknown as {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
  };
  const { data, error } = await supabase.rpc(
    "ai_eval_encrypt_target_token",
    {
      p_plaintext: plaintext,
      p_user_id: userId,
      p_key_id: key_id,
    },
  );
  if (error) {
    throw new Error(
      `target-store: failed to encrypt chatflow target credential`,
    );
  }
  return { ciphertext: data as Uint8Array | string, key_id };
}

async function decryptToken(
  userId: string,
  ciphertext: Uint8Array | string,
  key_id: string,
): Promise<string> {
  const supabase = client() as unknown as {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
  };
  const { data, error } = await supabase.rpc(
    "ai_eval_decrypt_target_token",
    {
      p_ciphertext: ciphertext,
      p_user_id: userId,
      p_key_id: key_id,
    },
  );
  if (error || data == null) {
    throw new Error(
      `target-store: failed to decrypt chatflow target credential`,
    );
  }
  return String(data);
}

function projectRow(row: Record<string, unknown>): ChatflowTargetOutput {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    api_host: String(row.api_host),
    chatflow_id: String(row.chatflow_id),
    base_trace_url:
      row.base_trace_url == null ? null : String(row.base_trace_url),
    default_tag: row.default_tag == null ? null : String(row.default_tag),
    prompt_template:
      row.prompt_template == null ? null : String(row.prompt_template),
    streaming: Boolean(row.streaming),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export async function listTargets(
  userId: string,
): Promise<ChatflowTargetOutput[]> {
  const { data, error } = await client()
    .from("chatflow_targets")
    .select(TARGET_OUTPUT_COLUMNS)
    .eq("user_id", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    throw new Error("target-store: failed to list chatflow targets");
  }
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows.map(projectRow);
}

export async function getTarget(
  userId: string,
  id: string,
): Promise<ChatflowTargetOutput | null> {
  const { data, error } = await client()
    .from("chatflow_targets")
    .select(TARGET_OUTPUT_COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("target-store: failed to read chatflow target");
  }
  if (!data) return null;
  return projectRow(data as Record<string, unknown>);
}

export async function createTarget(
  userId: string,
  input: ChatflowTargetInput,
): Promise<ChatflowTargetOutput> {
  const parsed = ChatflowTargetInputSchema.parse(input);
  if (!parsed.api_token) {
    throw new Error("target-store: api_token is required when creating a target");
  }

  const { ciphertext, key_id } = await encryptToken(userId, parsed.api_token);

  const insertRow = {
    user_id: userId,
    name: parsed.name,
    api_host: parsed.api_host,
    chatflow_id: parsed.chatflow_id,
    base_trace_url: parsed.base_trace_url ?? null,
    default_tag: parsed.default_tag ?? null,
    prompt_template: parsed.prompt_template ?? null,
    streaming: parsed.streaming ?? false,
    api_token_encrypted: ciphertext,
    api_token_key_id: key_id,
  };

  const { data, error } = await client()
    .from("chatflow_targets")
    .insert(insertRow)
    .select(TARGET_OUTPUT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("target-store: failed to create chatflow target");
  }
  return projectRow(data as Record<string, unknown>);
}

export async function updateTarget(
  userId: string,
  id: string,
  input: Partial<ChatflowTargetInput>,
): Promise<ChatflowTargetOutput> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.api_host !== undefined) patch.api_host = input.api_host;
  if (input.chatflow_id !== undefined) patch.chatflow_id = input.chatflow_id;
  if (input.base_trace_url !== undefined)
    patch.base_trace_url = input.base_trace_url;
  if (input.default_tag !== undefined) patch.default_tag = input.default_tag;
  if (input.prompt_template !== undefined)
    patch.prompt_template = input.prompt_template;
  if (input.streaming !== undefined) patch.streaming = input.streaming;

  if (input.api_token !== undefined && input.api_token.length > 0) {
    const { ciphertext, key_id } = await encryptToken(userId, input.api_token);
    patch.api_token_encrypted = ciphertext;
    patch.api_token_key_id = key_id;
  }

  const { data, error } = await client()
    .from("chatflow_targets")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select(TARGET_OUTPUT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("target-store: failed to update chatflow target");
  }
  return projectRow(data as Record<string, unknown>);
}

export async function deleteTarget(userId: string, id: string): Promise<void> {
  const { error } = await client()
    .from("chatflow_targets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw new Error("target-store: failed to delete chatflow target");
  }
}

/**
 * Returns the decrypted credential. The caller MUST pass the result straight
 * into the outbound request's Authorization header — never log it, never return
 * it to a client component, never serialize it into a response body.
 */
export async function decryptTokenForOutboundCall(
  userId: string,
  id: string,
): Promise<string> {
  const { data, error } = await client()
    .from("chatflow_targets")
    .select("api_token_encrypted, api_token_key_id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      "target-store: chatflow target not found for outbound credential",
    );
  }
  const row = data as {
    api_token_encrypted: Uint8Array | string;
    api_token_key_id: string;
  };
  return decryptToken(userId, row.api_token_encrypted, row.api_token_key_id);
}

export type { ChatflowTargetInput, ChatflowTargetOutput } from "./schema";
