"use server";

import { headers } from "next/headers";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { getSubscription, createPortalSession } from "@repo/billing";

export async function createPortalSessionAction(): Promise<string> {
  const h = await headers();
  const host = getHostFromRequestHeaders(h);
  const auth0 = getAuth0ClientForHost(host);
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.sub as string;
  const subscription = await getSubscription(userId);

  if (!subscription?.stripe_customer_id) {
    throw new Error("No active subscription");
  }

  const appUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const returnUrl = `${appUrl}/account`;

  return createPortalSession(subscription.stripe_customer_id, returnUrl);
}
