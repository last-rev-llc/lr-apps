import { handleStripeWebhook } from "@repo/billing/webhook-handler";
import { log, withRequestContext } from "@repo/logger";
import {
  applyRateLimitHeaders,
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

const WEBHOOK_RATE_LIMIT = 100;
const WEBHOOK_RATE_WINDOW_MS = 60_000;

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  return withRequestContext(
    { requestId, route: "stripe-webhook" },
    async () => {
      const ip = getClientIp(request.headers);
      const rateLimitResult = rateLimit(
        `webhook:${ip}`,
        WEBHOOK_RATE_LIMIT,
        WEBHOOK_RATE_WINDOW_MS,
      );
      if (!rateLimitResult.allowed) {
        log.warn("stripe webhook rate limited", { ip });
        return rateLimitResponse(rateLimitResult);
      }

      const signature = request.headers.get("stripe-signature");

      if (!signature) {
        log.warn("stripe webhook missing signature header");
        return applyRateLimitHeaders(
          Response.json(
            { error: "Missing stripe-signature header" },
            { status: 400 },
          ),
          rateLimitResult,
        );
      }

      const arrayBuffer = await request.arrayBuffer();
      const body = Buffer.from(arrayBuffer);

      try {
        const result = await handleStripeWebhook(body, signature);
        log.info("stripe webhook processed");
        return applyRateLimitHeaders(
          Response.json(result, { status: 200 }),
          rateLimitResult,
        );
      } catch (err) {
        log.error("stripe webhook failed", { err });
        const message = err instanceof Error ? err.message : "Unknown error";
        return applyRateLimitHeaders(
          Response.json({ error: message }, { status: 400 }),
          rateLimitResult,
        );
      }
    },
  );
}
