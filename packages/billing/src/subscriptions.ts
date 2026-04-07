import type Stripe from "stripe";
import { createServiceRoleClient } from "@repo/db/service-role";
import type { Subscription, Tier, SubscriptionStatus } from "./types";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const mapped: Record<string, SubscriptionStatus> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    trialing: "trialing",
    incomplete: "incomplete",
    incomplete_expired: "incomplete",
    unpaid: "past_due",
    paused: "active",
  };
  return mapped[status] ?? "active";
}

function extractTier(subscription: Stripe.Subscription): Tier {
  const item = subscription.items.data[0];
  const tier = item?.price?.metadata?.tier;
  if (tier === "pro" || tier === "enterprise") return tier;
  return "free";
}

export async function upsertSubscription(
  stripeSubscription: Stripe.Subscription,
): Promise<void> {
  const db = createServiceRoleClient();
  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  await db.from("subscriptions").upsert(
    {
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: customerId,
      tier: extractTier(stripeSubscription),
      status: mapStatus(stripeSubscription.status),
      current_period_start: new Date(
        stripeSubscription.current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date(
        stripeSubscription.current_period_end * 1000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  const db = createServiceRoleClient();

  const { data } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  return (data as Subscription) ?? null;
}
