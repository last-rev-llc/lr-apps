import { hasFeatureAccess, getFeatureFlagValue } from "@repo/billing";

/**
 * Tier-based feature gate that respects the `tier_enforcement_enabled` feature
 * flag. When the flag is `false` (or unset, which defaults to false), the gate
 * always returns `true` — letting M8 tier enforcement be rolled out gradually
 * per-user or per-tier without a code deploy.
 */
export async function enforceFeatureTier(
  userId: string,
  feature: string,
): Promise<boolean> {
  const enforcementOn = await getFeatureFlagValue(
    userId,
    "tier_enforcement_enabled",
  );
  if (!enforcementOn) return true;
  return hasFeatureAccess(userId, feature);
}
