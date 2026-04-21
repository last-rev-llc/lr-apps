import { createServiceRoleClient } from "@repo/db/service-role";
import { log, withRequestContext } from "@repo/logger";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETENTION_DAYS = 30;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  return withRequestContext(
    { requestId, route: "cron-cleanup" },
    async () => {
      const cutoff = new Date(
        Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      const db = createServiceRoleClient();
      const { data, error } = await db
        .from("processed_webhook_events")
        .delete()
        .lt("processed_at", cutoff)
        .select("event_id");

      if (error) {
        log.error("cron cleanup failed", { err: error });
        return Response.json({ error: error.message }, { status: 500 });
      }

      const deleted = data?.length ?? 0;
      log.info("cron cleanup complete", { deleted, cutoff });
      return Response.json({ deleted, cutoff });
    },
  );
}
