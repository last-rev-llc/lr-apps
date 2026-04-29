import type { Tier } from "@repo/billing";

export interface TierConfig {
  label: string;
  price: number;
  period: string;
  features: string[];
  stripePriceId: string | null;
}

export const TIERS: Record<Tier, TierConfig> = {
  free: {
    label: "Free",
    price: 0,
    period: "mo",
    features: [
      "Access to all free-tier apps",
      "Community support",
      "Basic analytics",
    ],
    stripePriceId: null,
  },
  pro: {
    label: "Pro",
    price: 29,
    period: "mo",
    features: [
      "Everything in Free",
      "Access to all pro-tier apps",
      "Priority support",
      "Advanced analytics",
      "API access",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO ?? null,
  },
  enterprise: {
    label: "Enterprise",
    price: 99,
    period: "mo",
    features: [
      "Everything in Pro",
      "Access to all enterprise apps",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "Team management",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE ?? null,
  },
};

export const TIER_ORDER: Tier[] = ["free", "pro", "enterprise"];

export interface FeatureLabel {
  requiredTier: Tier;
  label: string;
}

export const FEATURE_LABELS: Record<string, FeatureLabel> = {
  "ideas:ai-plan": { requiredTier: "pro", label: "AI idea planning & scoring" },
};
