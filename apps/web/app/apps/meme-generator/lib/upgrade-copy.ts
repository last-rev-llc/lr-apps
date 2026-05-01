import type { Tier } from "@repo/billing";

export interface QuotaUpgradeCopy {
  title: string;
  description: string;
  ctaHref: string | null;
  ctaLabel: string | null;
}

const PRICING_HREF = "/pricing";

export function quotaUpgradeCopyForTier(tier: Tier): QuotaUpgradeCopy {
  if (tier === "free") {
    return {
      title: "Save quota reached",
      description: "Upgrade to Pro for 200 saves.",
      ctaHref: PRICING_HREF,
      ctaLabel: "View Pricing",
    };
  }
  if (tier === "pro") {
    return {
      title: "Save quota reached",
      description: "Upgrade to Enterprise for 500 saves.",
      ctaHref: PRICING_HREF,
      ctaLabel: "View Pricing",
    };
  }
  return {
    title: "Limit reached",
    description: "You've reached the maximum number of saved memes.",
    ctaHref: null,
    ctaLabel: null,
  };
}

export function tierLabel(tier: Tier): string {
  if (tier === "pro") return "Pro";
  if (tier === "enterprise") return "Enterprise";
  return "Free";
}
