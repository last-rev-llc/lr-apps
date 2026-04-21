import { headers } from "next/headers";
import { z } from "zod";
import { getOrCreateCustomer, getStripe } from "@repo/billing";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { logAuditEvent } from "@repo/db/audit";
import { createServiceRoleClient } from "@repo/db/service-role";
import { log, withRequestContext } from "@repo/logger";
import { validateJson } from "@/lib/validate-request";

const checkoutSchema = z.object({
  priceId: z.string().min(1),
});

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  return withRequestContext(
    { requestId, route: "checkout-session" },
    async () => {
      const h = await headers();
      const host = getHostFromRequestHeaders(h);
      const auth0 = getAuth0ClientForHost(host);
      const session = await auth0.getSession();

      if (!session?.user) {
        log.warn("checkout session unauthorized");
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = session.user.sub as string;
      const email =
        typeof session.user.email === "string" ? session.user.email : "";

      const validated = await validateJson(request, checkoutSchema);
      if (!validated.ok) {
        log.warn("checkout session invalid input", { userId });
        return validated.response;
      }
      const { priceId } = validated.data;

      const appUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

      try {
        const customerId = await getOrCreateCustomer(userId, email);
        const stripe = getStripe();
        const checkoutSession = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          mode: "subscription",
          success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/checkout/cancel`,
        });

        log.info("checkout session created", { userId, priceId });
        await logAuditEvent(createServiceRoleClient(), {
          userId,
          action: "checkout.session.created",
          resource: checkoutSession.id ?? null,
          metadata: { priceId },
        });
        return Response.json({ checkoutUrl: checkoutSession.url });
      } catch (err) {
        log.error("checkout session failed", { err, userId, priceId });
        const message = err instanceof Error ? err.message : "Unknown error";
        return Response.json({ error: message }, { status: 500 });
      }
    },
  );
}
