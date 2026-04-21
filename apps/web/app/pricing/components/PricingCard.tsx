import { Pricing } from "@repo/ui";
import { UpgradeButton } from "./UpgradeButton";
import type { Tier } from "@repo/billing";

interface PricingCardProps {
  tier: Tier;
  label: string;
  price: number;
  period: string;
  features: string[];
  stripePriceId: string | null;
  isCurrent: boolean;
}

export function PricingCard({
  label,
  price,
  period,
  features,
  stripePriceId,
  isCurrent,
}: PricingCardProps) {
  const cta = stripePriceId ? (
    <UpgradeButton priceId={stripePriceId} isCurrent={isCurrent} />
  ) : isCurrent ? (
    <div className="flex items-center justify-center rounded-lg border border-accent/40 px-4 py-2 text-sm font-medium text-accent">
      Current Plan
    </div>
  ) : null;

  return (
    <Pricing
      title={label}
      price={price}
      period={period}
      features={features}
      cta={cta}
      highlighted={label === "Pro"}
    />
  );
}
