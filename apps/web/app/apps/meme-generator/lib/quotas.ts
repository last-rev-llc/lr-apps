import type { Tier } from "@repo/billing";

export const SAVE_QUOTAS: Record<Tier, number> = {
  free: 5,
  pro: 200,
  enterprise: 500,
};

export const UPGRADE_TIER: Record<Tier, Tier | undefined> = {
  free: "pro",
  pro: "enterprise",
  enterprise: undefined,
};
