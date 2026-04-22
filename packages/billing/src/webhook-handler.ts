import type Stripe from "stripe";
import { getStripe } from "./stripe-client";
import { upsertSubscription } from "./subscriptions";
import { createServiceRoleClient } from "@repo/db/service-role";
import { logAuditEvent } from "@repo/db/audit";
import type { Database } from "@repo/db/types";
import { log } from "@repo/logger";
import type { WebhookEventType } from "./types";

const AUDIT_ACTIONS: Record<string, string> = {
  "customer.subscription.created": "subscription.created",
  "customer.subscription.updated": "subscription.updated",
  "customer.subscription.deleted": "subscription.deleted",
};

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

  const db = createServiceRoleClient();

  // Idempotency: skip if this event has already been processed
  const { data: existing } = await db
    .from("processed_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle<{ event_id: string }>();

  if (existing) {
    return { received: true };
  }

  const subscription = event.data.object as Stripe.Subscription;

  if (event.type === "customer.subscription.deleted") {
    const update: Database["public"]["Tables"]["subscriptions"]["Update"] = {
      status: "canceled",
      updated_at: new Date().toISOString(),
    };
    await db
      .from("subscriptions")
      .update(update)
      .eq("stripe_subscription_id", subscription.id);
  } else {
    await upsertSubscription(subscription);
  }

  // Record the event ID to prevent duplicate processing
  try {
    const eventRow: Database["public"]["Tables"]["processed_webhook_events"]["Insert"] = {
      event_id: event.id,
    };
    await db.from("processed_webhook_events").insert(eventRow);
  } catch (err) {
    log.error("failed to record processed webhook event", {
      err,
      eventId: event.id,
      eventType: event.type,
    });
  }

  const auditAction = AUDIT_ACTIONS[event.type];
  if (auditAction) {
    await logAuditEvent(db, {
      action: auditAction,
      resource: subscription.id,
      metadata: {
        eventId: event.id,
        customerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id,
        status: subscription.status,
      },
    });
  }

  return { received: true };
}
