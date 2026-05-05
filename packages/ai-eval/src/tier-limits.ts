import type { Tier } from "@repo/billing/types";

export const QUESTION_SET_QUOTA = {
  free: 3,
  pro: 50,
  enterprise: -1,
} as const satisfies Record<Tier, number>;

export const CONCURRENCY_CAP = {
  free: 3,
  pro: 10,
  enterprise: 25,
} as const satisfies Record<Tier, number>;

export const RUNS_PER_DAY = {
  free: 5,
  pro: 200,
  enterprise: 2000,
} as const satisfies Record<Tier, number>;

export const PROMPT_TEMPLATE_MAX_BYTES = 16 * 1024;

export function enforceConcurrencyCap(tier: Tier, requested: number): number {
  const cap = CONCURRENCY_CAP[tier];
  const floored = Math.max(1, Math.floor(requested));
  return Math.min(floored, cap);
}
