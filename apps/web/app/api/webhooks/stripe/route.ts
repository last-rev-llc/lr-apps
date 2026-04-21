import { handleStripeWebhook } from "@repo/billing/webhook-handler";
import { log, withRequestContext } from "@repo/logger";

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  return withRequestContext(
    { requestId, route: "stripe-webhook" },
    async () => {
      const signature = request.headers.get("stripe-signature");

      if (!signature) {
        log.warn("stripe webhook missing signature header");
        return Response.json(
          { error: "Missing stripe-signature header" },
          { status: 400 },
        );
      }

      const arrayBuffer = await request.arrayBuffer();
      const body = Buffer.from(arrayBuffer);

      try {
        const result = await handleStripeWebhook(body, signature);
        log.info("stripe webhook processed");
        return Response.json(result, { status: 200 });
      } catch (err) {
        log.error("stripe webhook failed", { err });
        const message = err instanceof Error ? err.message : "Unknown error";
        return Response.json({ error: message }, { status: 400 });
      }
    },
  );
}
