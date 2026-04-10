import { getStripe } from "./stripe-client";

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}
