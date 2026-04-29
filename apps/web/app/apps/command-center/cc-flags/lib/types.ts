import type { Tier } from "@repo/billing";

export type Scope = "global" | "tier" | "user";

export interface FlagRow {
  id: string;
  key: string;
  user_id: string | null;
  tier: Tier | null;
  enabled: boolean;
  created_at: string;
  user_email?: string | null;
}

export interface FlagSummary {
  key: string;
  global: { id: string; enabled: boolean } | null;
  tiers: Record<Tier, { id: string; enabled: boolean } | null>;
  users: Array<{ id: string; user_id: string; user_email: string | null; enabled: boolean }>;
}
