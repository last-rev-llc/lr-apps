import { createServiceRoleClient } from "@repo/db/service-role";
import type { Database } from "@repo/db/types";
import { getStripe } from "./stripe-client";

export async function getOrCreateCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const db = createServiceRoleClient();

  const { data: existing } = await db
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single<{ stripe_customer_id: string | null }>();

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  const payload: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
    user_id: userId,
    stripe_customer_id: customer.id,
    tier: "free",
    status: "active",
  };
  await db.from("subscriptions").upsert(payload, { onConflict: "user_id" });

  return customer.id;
}
