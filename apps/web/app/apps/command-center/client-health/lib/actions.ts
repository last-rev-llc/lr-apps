"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { requireAccess } from "@repo/auth/server";
import { createClient } from "@repo/db/server";
import { createServiceRoleClient } from "@repo/db/service-role";
import { cacheGet, cacheSet } from "@repo/db/cache";
import { log } from "@repo/logger";
import { withSpan } from "@/lib/otel";
import { rateLimit } from "@/lib/rate-limit";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import { SUMMARY_MODEL_ID, summarize, type Summary } from "./ai-summary";

export type AddClientSiteInput = {
  url: string;
  name?: string | null;
};

export type AddClientSiteResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Inserts a client site, then best-effort triggers /api/cron/check-ssl/manual
 * so the UI sees fresh SSL data without waiting for the next 06:00 UTC tick.
 * Failure of the recheck does not block the insert.
 */
export async function addClientSite(input: AddClientSiteInput): Promise<AddClientSiteResult> {
  const url = input.url.trim();
  if (!url) return { ok: false, error: "url is required" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "invalid url" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "invalid url" };
  }

  // Cast the typed schema away — `client_sites` lives outside the generated
  // Supabase type union (managed by an out-of-tree migration trail).
  const db = createServiceRoleClient() as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      };
    };
  };
  const { data, error } = await db
    .from("client_sites")
    .insert({ url, name: input.name ?? null })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert failed" };
  }

  // Fire-and-forget: invoke the manual recheck without awaiting the response.
  // Failure to schedule must NOT block the action.
  void triggerManualSslCheck(url).catch((err) => {
    log.warn("manual ssl check trigger failed", {
      url,
      err: err instanceof Error ? err.message : String(err),
    });
  });

  return { ok: true, id: data.id as string };
}

const ClientIdSchema = z.string().min(1).max(200);

const SUMMARY_RATE_LIMIT = 20;
const SUMMARY_RATE_WINDOW_MS = 60 * 60 * 1000;
const SUMMARY_CACHE_TTL_SECONDS = 60 * 60;

export type SummarizeClientHealthResult =
  | {
      ok: true;
      summary: Summary;
      cached: boolean;
      cachedAt: string;
      model: string;
    }
  | { ok: false; error: "invalid_input" }
  | { ok: false; error: "feature_locked"; requiredTier: "pro" }
  | { ok: false; error: "rate_limited"; resetAt: number }
  | { ok: false; error: "client_not_found" }
  | { ok: false; error: "server_error" };

interface ClientSiteRow {
  client_id: string | null;
  client_name: string | null;
  url: string | null;
  status?: string | null;
  score?: number | null;
  responseTime?: number | null;
  uptime?: number | null;
  ssl_expiry?: string | null;
}

interface CachedSummary {
  summary: Summary;
  cachedAt: string;
  model: string;
}

export async function summarizeClientHealth(
  clientId: string,
): Promise<SummarizeClientHealthResult> {
  return withSpan(
    "client-health.summarize",
    { "app.slug": "command-center", "client.id": clientId },
    async () => {
      const parsed = ClientIdSchema.safeParse(clientId);
      if (!parsed.success) {
        return { ok: false, error: "invalid_input" };
      }
      const id = parsed.data;

      const { user } = await requireAccess("command-center");
      const userId = user.id;

      const allowed = await enforceFeatureTier(
        userId,
        "client-health:ai-summary",
      );
      if (!allowed) {
        return { ok: false, error: "feature_locked", requiredTier: "pro" };
      }

      const limit = rateLimit(
        `client-health:summarize:${userId}`,
        SUMMARY_RATE_LIMIT,
        SUMMARY_RATE_WINDOW_MS,
      );
      if (!limit.allowed) {
        log.warn("client-health.summarize rate limited", {
          action: "summarizeClientHealth",
          userId,
          resetAt: limit.reset,
        });
        return { ok: false, error: "rate_limited", resetAt: limit.reset };
      }

      const cacheKey = `client-health:summary:${id}`;
      const cached = await cacheGet<CachedSummary>(cacheKey);
      if (cached) {
        return {
          ok: true,
          summary: cached.summary,
          cached: true,
          cachedAt: cached.cachedAt,
          model: cached.model,
        };
      }

      const supabase = (await createClient()) as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: unknown) => Promise<{
              data: ClientSiteRow[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
      const { data: rows, error } = await supabase
        .from("client_sites")
        .select(
          "client_id, client_name, url, status, score, responseTime, uptime, ssl_expiry",
        )
        .eq("client_id", id);

      if (error) {
        log.error("client-health.summarize db error", {
          action: "summarizeClientHealth",
          userId,
          err: error,
        });
        return { ok: false, error: "server_error" };
      }

      const siteRows = rows ?? [];
      if (siteRows.length === 0) {
        return { ok: false, error: "client_not_found" };
      }

      const clientName = siteRows[0]?.client_name ?? id;
      const summary = await summarize({
        clientId: id,
        clientName,
        sites: siteRows
          .filter((r): r is ClientSiteRow & { url: string } =>
            typeof r.url === "string" && r.url.length > 0,
          )
          .map((r) => ({
            url: r.url,
            status: r.status ?? null,
            score: r.score ?? null,
            responseTime: r.responseTime ?? null,
            uptime: r.uptime ?? null,
            sslExpiry: r.ssl_expiry ?? null,
          })),
      });

      const cachedAt = new Date().toISOString();
      await cacheSet<CachedSummary>(
        cacheKey,
        { summary, cachedAt, model: SUMMARY_MODEL_ID },
        SUMMARY_CACHE_TTL_SECONDS,
      );

      log.debug("client-health.summarize ok", {
        action: "summarizeClientHealth",
        userId,
        clientId: id,
      });
      return {
        ok: true,
        summary,
        cached: false,
        cachedAt,
        model: SUMMARY_MODEL_ID,
      };
    },
  );
}

async function triggerManualSslCheck(url: string): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return;

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  if (!host) return;

  const target = `${proto}://${host}/api/cron/check-ssl/manual`;
  await fetch(target, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
}
