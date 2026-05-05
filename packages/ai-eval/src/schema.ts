import { z } from "zod";

export const ChatflowTargetInputSchema = z.object({
  name: z.string().min(1),
  api_host: z.string().url(),
  chatflow_id: z.string().min(1),
  api_token: z.string().min(1).optional(),
  base_trace_url: z.string().url().nullable().optional(),
  default_tag: z.string().nullable().optional(),
  prompt_template: z.string().nullable().optional(),
  streaming: z.boolean().optional(),
});

export type ChatflowTargetInput = z.infer<typeof ChatflowTargetInputSchema>;

export const ChatflowTargetOutputSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  api_host: z.string(),
  chatflow_id: z.string(),
  base_trace_url: z.string().nullable(),
  default_tag: z.string().nullable(),
  prompt_template: z.string().nullable(),
  streaming: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ChatflowTargetOutput = z.infer<typeof ChatflowTargetOutputSchema>;

export const TARGET_OUTPUT_COLUMNS =
  'id, user_id, name, api_host, chatflow_id, base_trace_url, default_tag, prompt_template, streaming, "createdAt", "updatedAt"' as const;

export type RunMode = "eval" | "csv";
export type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "cancelled"
  | "errored";
export type RunRowStatus =
  | "queued"
  | "running"
  | "completed"
  | "errored"
  | "cancelled";

export const RunInitInputSchema = z.object({
  target_id: z.string(),
  mode: z.enum(["eval", "csv"]),
  question_set_id: z.string().nullable().optional(),
  upload_storage_path: z.string().nullable().optional(),
  prompt_template: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
  concurrency: z.number().int().positive().optional(),
  inputs: z
    .array(
      z.object({
        uid: z.string().min(1),
        position: z.number().int().nonnegative(),
        prompt: z.string(),
        meta: z.record(z.string(), z.unknown()).nullable().optional(),
      }),
    )
    .min(1),
});

export type RunInitInput = z.infer<typeof RunInitInputSchema>;

export interface ChatflowRun {
  id: string;
  user_id: string;
  target_id: string;
  mode: RunMode;
  status: RunStatus;
  question_set_id: string | null;
  upload_storage_path: string | null;
  prompt_template: string | null;
  tag: string | null;
  concurrency: number;
  total_rows: number;
  completed_rows: number;
  errored_rows: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface ChatflowRunRow {
  id: string;
  run_id: string;
  uid: string;
  position: number;
  prompt: string;
  meta: Record<string, unknown> | null;
  status: RunRowStatus;
  response_text: string | null;
  response_json: Record<string, unknown> | null;
  langfuse_link: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export const TERMINAL_RUN_STATUSES: RunStatus[] = [
  "completed",
  "cancelled",
  "errored",
];
