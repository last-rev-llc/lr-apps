// Hourly status / health-drop alerting cron (issue #278).
// GET to match the Vercel cron pattern in this repo (apps/web/app/api/cron/cleanup/route.ts).
import { createServiceRoleClient } from "@repo/db/service-role";
import { log, withRequestContext } from "@repo/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { withSpan } from "@/lib/otel";
import { appOrigin } from "@/lib/app-host";
import {
  DEFAULT_ALERT_SETTINGS,
  evaluateAndAlert,
  getAlertSettingsForUser,
  type AlertCandidate,
  type AlertDecision,
} from "./alerting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSL_EXPIRED_THRESHOLD_DAYS = 0;

interface SiteRow {
  client_id: string;
  client_name: string | null;
  url: string;
  status: string | null;
  score: number | null;
  prev_score: number | null;
  ssl_expiry: string | null;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  return withRequestContext({ requestId, route: "cron-check-status" }, async () => {
    return withSpan("cron.check-status.run", {}, async () => {
      // The tables this cron reads (client_sites, sites, client_health_*)
      // live outside the generated Supabase type union, so we widen the
      // client to a generic any-shaped Supabase client.
      const db = createServiceRoleClient() as unknown as SupabaseClient;
      const usersResult = await db.from("client_sites").select("user_id").not("user_id", "is", null);
      if (usersResult.error) {
        log.error("cron check-status: client_sites query failed", { err: usersResult.error });
        return Response.json({ error: usersResult.error.message }, { status: 500 });
      }

      const rawRows = (usersResult.data ?? []) as Array<{ user_id?: string | null }>;
      const userIds = Array.from(
        new Set(
          rawRows
            .map((row) => row.user_id ?? null)
            .filter((id): id is string => typeof id === "string" && id.length > 0),
        ),
      );

      const hostHeader =
        request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
      // client-health is a sub-route of command-center (see app-registry.ts:44),
      // so we resolve the deep-link host from the command-center subdomain.
      const dashboardOrigin = hostHeader
        ? appOrigin({ subdomain: "command-center" }, hostHeader)
        : null;

      const allDecisions: AlertDecision[] = [];
      for (const userId of userIds) {
        const decisions = await withSpan(
          "cron.check-status.user",
          { "user.id": userId },
          () => processUser(db, userId, dashboardOrigin),
        );
        allDecisions.push(...decisions);
      }

      const counts = countDecisions(allDecisions);
      log.info("cron check-status complete", { users: userIds.length, ...counts });
      return Response.json({ users: userIds.length, decisions: counts });
    });
  });
}

async function processUser(
  db: SupabaseClient,
  userId: string,
  dashboardOrigin: string | null,
): Promise<AlertDecision[]> {
  const settings = await getAlertSettingsForUser(userId, db).catch(() => ({
    ...DEFAULT_ALERT_SETTINGS,
  }));

  const userInfo = await db
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const userEmail =
    userInfo.data && typeof userInfo.data.email === "string" ? userInfo.data.email : null;

  const sites = await db
    .from("sites")
    .select("client_id, client_name, url, status, score, prev_score, ssl_expiry")
    .eq("user_id", userId);
  if (sites.error) {
    log.warn("sites query failed", { userId, err: sites.error.message });
    return [];
  }

  const candidates = buildCandidates((sites.data ?? []) as SiteRow[], settings);
  if (candidates.length === 0) return [];

  return evaluateAndAlert({
    db,
    userId,
    userEmail,
    settings,
    candidates,
    dashboardOrigin,
  });
}

export function buildCandidates(
  rows: SiteRow[],
  settings: { sslWarnDays: number; healthDropThreshold: number },
): AlertCandidate[] {
  const byClient = new Map<string, SiteRow[]>();
  for (const row of rows) {
    if (!row.client_id) continue;
    const list = byClient.get(row.client_id) ?? [];
    list.push(row);
    byClient.set(row.client_id, list);
  }

  const now = Date.now();
  const candidates: AlertCandidate[] = [];

  for (const [clientId, clientRows] of byClient) {
    const clientName = clientRows[0]?.client_name ?? clientId;

    const downSites = clientRows.filter((s) => s.status === "down");
    if (downSites.length > 0) {
      candidates.push({
        type: "status-down",
        clientId,
        clientName,
        summary: `${downSites.length} site${downSites.length === 1 ? "" : "s"} reporting down for ${clientName}.`,
        offenders: downSites.map((s) => ({
          name: s.url,
          url: s.url,
          detail: "down",
        })),
      });
    }

    const expired: SiteRow[] = [];
    const expiring: SiteRow[] = [];
    for (const s of clientRows) {
      if (!s.ssl_expiry) continue;
      const ms = Date.parse(s.ssl_expiry);
      if (Number.isNaN(ms)) continue;
      const daysUntil = (ms - now) / (1000 * 60 * 60 * 24);
      if (daysUntil <= SSL_EXPIRED_THRESHOLD_DAYS) expired.push(s);
      else if (daysUntil <= settings.sslWarnDays) expiring.push(s);
    }
    if (expired.length > 0) {
      candidates.push({
        type: "ssl-expired",
        clientId,
        clientName,
        summary: `${expired.length} certificate${expired.length === 1 ? "" : "s"} expired for ${clientName}.`,
        offenders: expired.map((s) => ({
          name: s.url,
          url: s.url,
          detail: `expired ${s.ssl_expiry}`,
        })),
      });
    }
    if (expiring.length > 0) {
      candidates.push({
        type: "ssl-expiring",
        clientId,
        clientName,
        summary: `${expiring.length} certificate${expiring.length === 1 ? "" : "s"} expiring within ${settings.sslWarnDays} days for ${clientName}.`,
        offenders: expiring.map((s) => ({
          name: s.url,
          url: s.url,
          detail: `expires ${s.ssl_expiry}`,
        })),
      });
    }

    // Score drop — measured against the last value persisted in `prev_score`.
    const sample = clientRows.find((s) => typeof s.score === "number" && typeof s.prev_score === "number");
    if (sample && typeof sample.score === "number" && typeof sample.prev_score === "number") {
      const delta = sample.score - sample.prev_score;
      if (delta <= -settings.healthDropThreshold) {
        candidates.push({
          type: "score-drop",
          clientId,
          clientName,
          summary: `Health score dropped ${Math.abs(delta)} points for ${clientName}.`,
          score: sample.score,
          scoreDelta: delta,
          offenders: [],
        });
      }
    }
  }

  return candidates;
}

function countDecisions(decisions: AlertDecision[]): {
  sent: number;
  deduped: number;
  skipped: number;
} {
  let sent = 0;
  let deduped = 0;
  let skipped = 0;
  for (const d of decisions) {
    if (d.status === "sent") sent += 1;
    else if (d.status === "deduped") deduped += 1;
    else skipped += 1;
  }
  return { sent, deduped, skipped };
}
