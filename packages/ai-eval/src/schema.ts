import { z } from "zod";
import { PROMPT_TEMPLATE_MAX_BYTES } from "./tier-limits";

const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "");

export const ChatflowTargetInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  api_host: z.string().url().transform(stripTrailingSlash),
  chatflow_id: z.string().min(1),
  api_token: z.string().min(1),
  base_trace_url: z.string().url().optional(),
  prompt_template: z
    .string()
    .refine(
      (s) => new TextEncoder().encode(s).byteLength <= PROMPT_TEMPLATE_MAX_BYTES,
      { message: "prompt_template exceeds 16 KiB" },
    )
    .optional(),
  is_default: z.boolean().optional(),
});

export const ChatflowTargetOutputSchema = z
  .object({
    id: z.string().uuid(),
    owner_id: z.string().uuid(),
    name: z.string().min(1).max(200),
    api_host: z.string().url(),
    chatflow_id: z.string().min(1),
    base_trace_url: z.string().url().nullable(),
    prompt_template: z.string().nullable(),
    is_default: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .strict();

export const QuestionSetItemSchema = z.object({
  uid: z.string().min(1),
  question: z.string().min(1),
});

export const QuestionSetSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  items: z.array(QuestionSetItemSchema).min(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ChatflowRunSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  target_id: z.string().uuid(),
  question_set_id: z.string().uuid().nullable(),
  source_kind: z.enum(["question_set", "csv"]),
  status: z.enum(["queued", "running", "completed", "cancelled", "errored"]),
  concurrency: z.number().int().positive(),
  totals: z.object({
    total: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    errored: z.number().int().nonnegative(),
  }),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  langfuse_run_id: z.string().nullable(),
});

export const ChatflowRunRowSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  row_index: z.number().int().nonnegative(),
  uid: z.string().nullable(),
  question: z.string(),
  response_text: z.string().nullable(),
  response_json: z.unknown().optional(),
  langfuse_link: z.string().nullable(),
  error_message: z.string().nullable(),
  status: z.enum(["pending", "running", "completed", "errored", "cancelled"]),
});

export const StartRunInputSchema = z.object({
  target_id: z.string().uuid(),
  source: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("question_set"),
      question_set_id: z.string().uuid(),
    }),
    z.object({
      kind: z.literal("csv"),
      rows: z.array(z.record(z.string(), z.string())).min(1),
      question_column: z.string().min(1),
    }),
  ]),
  concurrency: z.number().int().min(1),
});

export type ChatflowTargetInput = z.infer<typeof ChatflowTargetInputSchema>;
export type ChatflowTargetOutput = z.infer<typeof ChatflowTargetOutputSchema>;
export type QuestionSetItem = z.infer<typeof QuestionSetItemSchema>;
export type QuestionSet = z.infer<typeof QuestionSetSchema>;
export type ChatflowRun = z.infer<typeof ChatflowRunSchema>;
export type ChatflowRunRow = z.infer<typeof ChatflowRunRowSchema>;
export type StartRunInput = z.infer<typeof StartRunInputSchema>;
