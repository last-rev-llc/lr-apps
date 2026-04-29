import { createServiceRoleClient } from "@repo/db/service-role";
import { getSubscription } from "./subscriptions";
import type { Tier } from "./types";

export interface FeatureFlagRow {
  id: string;
  key: string;
  user_id: string | null;
  tier: Tier | null;
  enabled: boolean;
  created_at: string;
}

/**
 * Resolves a feature flag value for the given user. Resolution order:
 *   1. user-specific override (user_id matches, tier null)
 *   2. tier-level default (tier matches user's subscription tier, user_id null)
 *   3. global default (user_id null AND tier null)
 *   4. fallback: false
 */
export async function getFeatureFlagValue(
  userId: string,
  key: string,
): Promise<boolean> {
  const db = createServiceRoleClient();
  const { data } = await db
    .from("feature_flags")
    .select("user_id, tier, enabled")
    .eq("key", key);

  const rows = (data ?? []) as Pick<
    FeatureFlagRow,
    "user_id" | "tier" | "enabled"
  >[];

  const userOverride = rows.find((r) => r.user_id === userId);
  if (userOverride) return userOverride.enabled;

  const subscription = await getSubscription(userId);
  const userTier: Tier = subscription?.tier ?? "free";
  const tierFlag = rows.find(
    (r) => r.user_id === null && r.tier === userTier,
  );
  if (tierFlag) return tierFlag.enabled;

  const globalFlag = rows.find(
    (r) => r.user_id === null && r.tier === null,
  );
  if (globalFlag) return globalFlag.enabled;

  return false;
}
