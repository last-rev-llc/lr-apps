"use client";

import type { Tier } from "@repo/billing";
import { tierLabel } from "../lib/upgrade-copy";

export interface QuotaIndicatorProps {
  count: number;
  limit: number;
  tier: Tier;
}

export function QuotaIndicator({ count, limit, tier }: QuotaIndicatorProps) {
  const label = tierLabel(tier);
  return (
    <span
      data-testid="quota-indicator"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      {count}/{limit} saved memes ({label})
    </span>
  );
}
