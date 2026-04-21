import { timingSafeEqual } from "node:crypto";

/**
 * Validates the Authorization header on Vercel cron requests.
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` for routes triggered
 * by the schedule defined in `vercel.json`. Fails closed if `CRON_SECRET`
 * is missing.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get("authorization");
  if (!header) return false;

  const [scheme, token] = header.split(" ", 2);
  if (scheme !== "Bearer" || !token) return false;

  const expectedBuf = Buffer.from(expected, "utf8");
  const tokenBuf = Buffer.from(token, "utf8");
  if (expectedBuf.length !== tokenBuf.length) return false;
  return timingSafeEqual(expectedBuf, tokenBuf);
}
