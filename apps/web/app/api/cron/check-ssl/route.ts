// Daily SSL monitoring cron (issue #276).
// Vercel cron is GET-based for this repo (see apps/web/app/api/cron/cleanup/route.ts).
// The schedule entry lives in apps/web/vercel.json (06:00 UTC).
import { createServiceRoleClient } from "@repo/db/service-role";
import { log, withRequestContext } from "@repo/logger";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { pLimit } from "@/lib/concurrent";
import { withSpan } from "@/lib/otel";
import { checkSslForUrl } from "./check-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONCURRENCY = 10;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  return withRequestContext(
    { requestId, route: "cron-check-ssl" },
    async () => {
      return withSpan("cron.check-ssl.run", {}, async () => {
        const db = createServiceRoleClient();
        const { data, error } = await db
          .from("client_sites")
          .select("url");

        if (error) {
          log.error("cron check-ssl: client_sites query failed", { err: error });
          return Response.json({ error: error.message }, { status: 500 });
        }

        const urls = Array.from(
          new Set(
            (data ?? [])
              .map((row: { url?: string | null }) => row.url ?? "")
              .filter((url): url is string => typeof url === "string" && url.length > 0),
          ),
        );

        const limit = pLimit(CONCURRENCY);
        const results = await Promise.all(
          urls.map((url) => limit(() => checkSslForUrl(url, db))),
        );

        const ok = results.filter((r) => r.ok).length;
        const failed = results.length - ok;
        log.info("cron check-ssl complete", { total: urls.length, ok, failed });
        return Response.json({ checked: urls.length, ok, failed });
      });
    },
  );
}
