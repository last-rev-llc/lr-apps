import type Stripe from "stripe";
import { getStripe } from "./stripe-client";
import { upsertSubscription } from "./subscriptions";
import { createServiceRoleClient } from "@repo/db/service-role";
import type { WebhookEventType } from "./types";

const HANDLED_EVENTS: Set<string> = new Set<WebhookEventType>([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function handleStripeWebhook(
  body: string | Buffer,
  signature: string,
): Promise<{ received: true }> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(body, signature, secret);

  if (!HANDLED_EVENTS.has(event.type)) {
    return { received: true };
  }

  const subscription = event.data.object as Stripe.Subscription;

  if (event.type === "customer.subscription.deleted") {
    const db = createServiceRoleClient();
    await db
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);
  } else {
    await upsertSubscription(subscription);
  }

  return { received: true };
}
