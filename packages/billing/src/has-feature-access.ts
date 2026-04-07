import type { Tier } from "./types";
import { getSubscription } from "./subscriptions";

const TIER_RANK: Record<Tier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

const FEATURE_TIER: Record<string, Tier> = {
  basic: "free",
  advanced: "pro",
  custom: "enterprise",
};

export async function hasFeatureAccess(
  userId: string,
  feature: string,
): Promise<boolean> {
  const requiredTier = FEATURE_TIER[feature];
  if (!requiredTier) return false;

  const subscription = await getSubscription(userId);
  const userTier: Tier = subscription?.tier ?? "free";

  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}
