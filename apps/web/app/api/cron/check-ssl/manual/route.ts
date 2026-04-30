// Manual single-URL SSL re-check (issue #277).
// Called best-effort from server actions (e.g. addClientSite) so users see
// SSL data without waiting for the next 06:00 UTC tick.
import { z } from "zod";
import { createServiceRoleClient } from "@repo/db/service-role";
import { log, withRequestContext } from "@repo/logger";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { checkSslForUrl } from "../check-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

const bodySchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit(`check-ssl:manual:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rl.allowed) {
    return rateLimitResponse(rl);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_body", message: "expected JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_body", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { url } = parsed.data;
  const requestId = crypto.randomUUID();
  return withRequestContext(
    { requestId, route: "cron-check-ssl-manual" },
    async () => {
      const db = createServiceRoleClient();
      const result = await checkSslForUrl(url, db);
      log.info("manual ssl check complete", { url, ok: result.ok });
      return Response.json({ ok: true, result });
    },
  );
}
