import "server-only";

import { createServiceRoleClient } from "@repo/db/service-role";
import {
  RunInitInputSchema,
  TERMINAL_RUN_STATUSES,
  type ChatflowRun,
  type ChatflowRunRow,
  type RunInitInput,
  type RunMode,
  type RunRowStatus,
  type RunStatus,
} from "./schema";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

let _clientFactory: () => ServiceClient = () => createServiceRoleClient();

/** Test seam for swapping in a mock supabase client. */
export function __setClientFactoryForTesting(factory: () => ServiceClient) {
  _clientFactory = factory;
}

function client(): ServiceClient {
  return _clientFactory();
}

interface ListRunsOptions {
  mode?: RunMode;
  targetId?: string;
  limit?: number;
  offset?: number;
}

interface GetRunOptions {
  limit?: number;
  offset?: number;
}

export async function createRun(
  userId: string,
  init: RunInitInput,
): Promise<ChatflowRun> {
  const parsed = RunInitInputSchema.parse(init);

  // The atomic insert (run + rows) is performed by a SECURITY DEFINER plpgsql
  // function defined in the chatflow runs migration. The function returns the
  // run id; we then SELECT the row back through the same service-role
  // connection so callers always get a typed `ChatflowRun`.
  const supabase = client() as unknown as {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
  };
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "create_chatflow_run",
    {
      p_user_id: userId,
      p_target_id: parsed.target_id,
      p_mode: parsed.mode,
      p_question_set_id: parsed.question_set_id ?? null,
      p_upload_storage_path: parsed.upload_storage_path ?? null,
      p_prompt_template: parsed.prompt_template ?? null,
      p_tag: parsed.tag ?? null,
      p_concurrency: parsed.concurrency ?? 4,
      p_inputs: parsed.inputs,
    },
  );
  if (rpcError) {
    throw new Error("run-store: failed to create chatflow run");
  }
  const runId =
    typeof rpcData === "string"
      ? rpcData
      : (rpcData as { id?: string } | null)?.id;
  if (!runId) {
    throw new Error("run-store: create_chatflow_run did not return a run id");
  }

  const { data, error } = await client()
    .from("chatflow_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("run-store: failed to load freshly created run");
  }
  return data as ChatflowRun;
}

export async function getRunWithRows(
  userId: string,
  runId: string,
  opts: GetRunOptions = {},
): Promise<{ run: ChatflowRun; rows: ChatflowRunRow[] } | null> {
  const limit = opts.limit ?? 200;
  const offset = opts.offset ?? 0;

  const { data: runData, error: runErr } = await client()
    .from("chatflow_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();
  if (runErr) throw new Error("run-store: failed to read chatflow run");
  if (!runData) return null;

  const { data: rowsData, error: rowsErr } = await client()
    .from("chatflow_run_rows")
    .select("*")
    .eq("run_id", runId)
    .order("position", { ascending: true })
    .range(offset, offset + limit - 1);
  if (rowsErr) throw new Error("run-store: failed to read run rows");

  return {
    run: runData as ChatflowRun,
    rows: (rowsData ?? []) as ChatflowRunRow[],
  };
}

export async function listRuns(
  userId: string,
  opts: ListRunsOptions = {},
): Promise<{ runs: ChatflowRun[]; total: number }> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let q = client()
    .from("chatflow_runs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("startedAt", { ascending: false });

  if (opts.mode) q = q.eq("mode", opts.mode);
  if (opts.targetId) q = q.eq("target_id", opts.targetId);

  const { data, count, error } = await q.range(offset, offset + limit - 1);
  if (error) throw new Error("run-store: failed to list chatflow runs");
  return {
    runs: (data ?? []) as ChatflowRun[],
    total: count ?? (data ?? []).length,
  };
}

export interface RowResultPatch {
  status: RunRowStatus;
  response_text?: string | null;
  response_json?: Record<string, unknown> | null;
  langfuse_link?: string | null;
  error?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export async function updateRowResult(
  runId: string,
  rowId: string,
  patch: RowResultPatch,
): Promise<void> {
  const { error } = await client()
    .from("chatflow_run_rows")
    .update(patch as Record<string, unknown>)
    .eq("id", rowId)
    .eq("run_id", runId);
  if (error) throw new Error("run-store: failed to update run row");
}

export interface RunStatusPatch {
  finishedAt?: string | null;
  error?: string | null;
}

export async function setRunStatus(
  runId: string,
  status: RunStatus,
  patch: RunStatusPatch = {},
): Promise<void> {
  const update: Record<string, unknown> = { status, ...patch };
  const { error } = await client()
    .from("chatflow_runs")
    .update(update)
    .eq("id", runId);
  if (error) throw new Error("run-store: failed to set run status");
}

/**
 * Idempotent cancel: only flips a run from queued/running to cancelled. If the
 * run is already terminal (completed/cancelled/errored) the WHERE clause
 * filters it out and the call is a no-op.
 */
export async function markRunCancelled(
  userId: string,
  runId: string,
): Promise<void> {
  const { error } = await client()
    .from("chatflow_runs")
    .update({ status: "cancelled", finishedAt: new Date().toISOString() })
    .eq("id", runId)
    .eq("user_id", userId)
    .in("status", ["queued", "running"])
    .select("id");
  if (error) throw new Error("run-store: failed to cancel chatflow run");
}

/**
 * Atomic counter bump backed by a SQL function:
 *   UPDATE chatflow_runs
 *   SET completed_rows = completed_rows + p_completed_delta,
 *       errored_rows   = errored_rows   + p_errored_delta
 *   WHERE id = p_run_id
 * Concurrent calls serialize at the row level.
 */
export async function incrementRunCounters(
  runId: string,
  completed = 0,
  errored = 0,
): Promise<void> {
  const supabase = client() as unknown as {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
  };
  const { error } = await supabase.rpc("bump_chatflow_run_counters", {
    p_run_id: runId,
    p_completed_delta: completed,
    p_errored_delta: errored,
  });
  if (error) throw new Error("run-store: failed to bump run counters");
}

export { TERMINAL_RUN_STATUSES };
export type {
  ChatflowRun,
  ChatflowRunRow,
  RunInitInput,
  RunStatus,
  RunRowStatus,
} from "./schema";
