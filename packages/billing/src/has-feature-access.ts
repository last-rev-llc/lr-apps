import type { Tier, SubscriptionStatus } from "./types";
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

const ALLOWED_STATUSES = new Set<SubscriptionStatus>(["active", "trialing"]);

export async function hasFeatureAccess(
  userId: string,
  feature: string,
): Promise<boolean> {
  const requiredTier = FEATURE_TIER[feature];
  if (!requiredTier) return false;

  const subscription = await getSubscription(userId);

  if (subscription && !ALLOWED_STATUSES.has(subscription.status)) {
    return false;
  }

  const userTier: Tier = subscription?.tier ?? "free";

  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}
