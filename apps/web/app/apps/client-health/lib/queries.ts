import { createClient } from "@repo/db/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_ALERT_SETTINGS,
  type AlertSettings,
} from "@/app/api/cron/check-status/alerting";

export type AlertHistoryRow = {
  id: string;
  type: string;
  severity: string;
  message: string;
  clientId: string | null;
  clientName: string | null;
  deliveredAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
};

/**
 * Reads the user's alert preferences. Falls back to DEFAULT_ALERT_SETTINGS
 * when no row exists or on error.
 */
export async function getAlertSettings(userId: string): Promise<AlertSettings> {
  // client_health_settings lives outside the generated Supabase type union.
  const db = (await createClient()) as unknown as SupabaseClient;
  const { data, error } = await db
    .from("client_health_settings")
    .select("emailEnabled, alertEmail, sslWarnDays, healthDropThreshold")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_ALERT_SETTINGS };
  return {
    emailEnabled:
      typeof data.emailEnabled === "boolean"
        ? data.emailEnabled
        : DEFAULT_ALERT_SETTINGS.emailEnabled,
    alertEmail:
      typeof data.alertEmail === "string" && data.alertEmail.length > 0
        ? data.alertEmail
        : null,
    sslWarnDays:
      typeof data.sslWarnDays === "number"
        ? data.sslWarnDays
        : DEFAULT_ALERT_SETTINGS.sslWarnDays,
    healthDropThreshold:
      typeof data.healthDropThreshold === "number"
        ? data.healthDropThreshold
        : DEFAULT_ALERT_SETTINGS.healthDropThreshold,
  };
}

/**
 * Lists the user's alerts most-recent-first, capped at `limit` rows.
 * Joins client name from `client_sites` since `client_health_alerts.client_id`
 * is a free-form id and `clients` table is not in the generated type union.
 */
export async function listAlertsForUser(
  userId: string,
  limit = 100,
): Promise<AlertHistoryRow[]> {
  const db = (await createClient()) as unknown as SupabaseClient;
  const { data, error } = await db
    .from("client_health_alerts")
    .select(
      "id, type, payload, client_id, deliveredAt, acknowledgedAt, createdAt",
    )
    .eq("user_id", userId)
    .order("createdAt", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // Best-effort client_name lookup. Skip if no client ids.
  const clientIds = Array.from(
    new Set(
      (data as Array<{ client_id: string | null }>)
        .map((r) => r.client_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const nameById = new Map<string, string>();
  if (clientIds.length > 0) {
    const sites = await db
      .from("client_sites")
      .select("client_id, client_name")
      .in("client_id", clientIds);
    for (const row of (sites.data ?? []) as Array<{
      client_id: string | null;
      client_name: string | null;
    }>) {
      if (row.client_id && row.client_name && !nameById.has(row.client_id)) {
        nameById.set(row.client_id, row.client_name);
      }
    }
  }

  return (
    data as Array<{
      id: string;
      type: string;
      payload: { summary?: string; severity?: string } | null;
      client_id: string | null;
      deliveredAt: string | null;
      acknowledgedAt: string | null;
      createdAt: string;
    }>
  ).map((row) => ({
    id: row.id,
    type: row.type,
    severity:
      typeof row.payload?.severity === "string" ? row.payload.severity : "critical",
    message: row.payload?.summary ?? "",
    clientId: row.client_id,
    clientName: row.client_id ? nameById.get(row.client_id) ?? null : null,
    deliveredAt: row.deliveredAt,
    acknowledgedAt: row.acknowledgedAt,
    createdAt: row.createdAt,
  }));
}
