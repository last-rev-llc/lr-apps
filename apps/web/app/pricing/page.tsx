import { headers } from "next/headers";
import { getSubscription } from "@repo/billing";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { TIERS, TIER_ORDER } from "@/lib/tier-config";
import { PricingCard } from "./components/PricingCard";
import type { Metadata } from "next";
import type { Tier } from "@repo/billing";

export const metadata: Metadata = {
  title: "Pricing — LR Apps",
  description: "Choose the plan that's right for you.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const h = await headers();
  const host = getHostFromRequestHeaders(h);
  const auth0 = getAuth0ClientForHost(host);
  const session = await auth0.getSession();

  let currentTier: Tier = "free";
  if (session?.user) {
    const userId = session.user.sub as string;
    const subscription = await getSubscription(userId);
    if (subscription?.tier) {
      currentTier = subscription.tier;
    }
  }

  return (
    <div className="min-h-screen bg-surface-base py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h1 className="font-heading text-4xl font-bold text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-lg text-white/60">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIER_ORDER.map((tier) => {
            const config = TIERS[tier];
            return (
              <PricingCard
                key={tier}
                tier={tier}
                label={config.label}
                price={config.price}
                period={config.period}
                features={config.features}
                stripePriceId={config.stripePriceId}
                isCurrent={tier === currentTier}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
