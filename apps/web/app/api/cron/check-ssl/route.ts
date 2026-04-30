// Daily SSL monitoring cron (issue #276).
// Vercel cron is GET-based for this repo (see apps/web/app/api/cron/cleanup/route.ts).
// The schedule entry lives in apps/web/vercel.json (06:00 UTC).
import { createServiceRoleClient } from "@repo/db/service-role";
import { log, withRequestContext } from "@repo/logger";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { pLimit } from "@/lib/concurrent";
import { withSpan } from "@/lib/otel";
import { checkSslForUrl, type SslCheckResult } from "./check-url";
import {
  DEFAULT_ALERT_SETTINGS,
  evaluateAndAlert,
  getAlertSettingsForUser,
  type AlertCandidate,
} from "../check-status/alerting";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONCURRENCY = 10;

interface ClientSiteRow {
  user_id: string | null;
  client_id: string | null;
  client_name: string | null;
  url: string | null;
}

async function fanoutExpiryAlerts(
  db: SupabaseClient,
  results: SslCheckResult[],
): Promise<void> {
  const okResults = results.filter(
    (r): r is Extract<SslCheckResult, { ok: true }> => r.ok,
  );
  if (okResults.length === 0) return;

  const okByUrl = new Map<string, Extract<SslCheckResult, { ok: true }>>();
  for (const r of okResults) okByUrl.set(r.url, r);

  const sites = await db
    .from("client_sites")
    .select("user_id, client_id, client_name, url")
    .in("url", Array.from(okByUrl.keys()));
  if (sites.error) {
    log.warn("ssl alerting: client_sites lookup failed", { err: sites.error.message });
    return;
  }

  // Group sites by user and bin per-client by status.
  type Bucket = {
    clientName: string;
    expired: Array<{ url: string; sslExpiry: string }>;
    expiring: Array<{ url: string; sslExpiry: string }>;
  };
  const byUser = new Map<string, Map<string, Bucket>>();

  for (const row of (sites.data ?? []) as ClientSiteRow[]) {
    if (!row.user_id || !row.client_id || !row.url) continue;
    const r = okByUrl.get(row.url);
    if (!r) continue;
    const userMap = byUser.get(row.user_id) ?? new Map<string, Bucket>();
    const bucket = userMap.get(row.client_id) ?? {
      clientName: row.client_name ?? row.client_id,
      expired: [],
      expiring: [],
    };
    if (r.daysUntilExpiry <= 0) {
      bucket.expired.push({ url: row.url, sslExpiry: r.sslExpiry });
    }
    userMap.set(row.client_id, bucket);
    byUser.set(row.user_id, userMap);
  }

  for (const [userId, userMap] of byUser) {
    const settings = await getAlertSettingsForUser(userId, db).catch(() => ({
      ...DEFAULT_ALERT_SETTINGS,
    }));

    // Re-bucket expiring against the user's sslWarnDays threshold.
    const candidates: AlertCandidate[] = [];
    for (const [clientId, bucket] of userMap) {
      const expiringForUser: Array<{ url: string; sslExpiry: string }> = [];
      for (const [url, r] of okByUrl) {
        const matches = (sites.data ?? []).some(
          (s) =>
            (s as ClientSiteRow).user_id === userId &&
            (s as ClientSiteRow).client_id === clientId &&
            (s as ClientSiteRow).url === url,
        );
        if (!matches) continue;
        if (r.daysUntilExpiry > 0 && r.daysUntilExpiry <= settings.sslWarnDays) {
          expiringForUser.push({ url, sslExpiry: r.sslExpiry });
        }
      }
      if (bucket.expired.length > 0) {
        candidates.push({
          type: "ssl-expired",
          clientId,
          clientName: bucket.clientName,
          summary: `${bucket.expired.length} certificate${bucket.expired.length === 1 ? "" : "s"} expired for ${bucket.clientName}.`,
          offenders: bucket.expired.map((s) => ({
            name: s.url,
            url: s.url,
            detail: `expired ${s.sslExpiry}`,
          })),
        });
      }
      if (expiringForUser.length > 0) {
        candidates.push({
          type: "ssl-expiring",
          clientId,
          clientName: bucket.clientName,
          summary: `${expiringForUser.length} certificate${expiringForUser.length === 1 ? "" : "s"} expiring within ${settings.sslWarnDays} days for ${bucket.clientName}.`,
          offenders: expiringForUser.map((s) => ({
            name: s.url,
            url: s.url,
            detail: `expires ${s.sslExpiry}`,
          })),
        });
      }
    }

    if (candidates.length === 0) continue;

    const userInfo = await db
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    const userEmail =
      userInfo.data && typeof userInfo.data.email === "string" ? userInfo.data.email : null;

    await evaluateAndAlert({ db, userId, userEmail, settings, candidates });
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  return withRequestContext(
    { requestId, route: "cron-check-ssl" },
    async () => {
      return withSpan("cron.check-ssl.run", {}, async () => {
        // client_sites is managed by an out-of-tree migration trail and
        // is not in the generated Supabase type union; widen the client.
        const db = createServiceRoleClient() as unknown as SupabaseClient;
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

        // Fire alerts for any cert that is expired or within sslWarnDays. We
        // group by user so each user pays at most one DB read for settings.
        await fanoutExpiryAlerts(db, results).catch((err) => {
          log.warn("ssl alerting fan-out failed", {
            err: err instanceof Error ? err.message : String(err),
          });
        });

        log.info("cron check-ssl complete", { total: urls.length, ok, failed });
        return Response.json({ checked: urls.length, ok, failed });
      });
    },
  );
}
