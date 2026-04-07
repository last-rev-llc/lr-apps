import { createServiceRoleClient } from "@repo/db/service-role";
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
    .single();

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await db.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      tier: "free",
      status: "active",
    },
    { onConflict: "user_id" },
  );

  return customer.id;
}
