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
 * Joins client name from `public.clients` via the alert's `clientId` FK.
 *
 * Column names match the migration schema (20260429e_client_health_alerts.sql,
 * 20260429b_client_sites.sql, 20260429a_clients.sql): camelCase columns are
 * quoted in DDL and surfaced through PostgREST under the same case-sensitive
 * names.
 */
export async function listAlertsForUser(
  userId: string,
  limit = 100,
): Promise<AlertHistoryRow[]> {
  const db = (await createClient()) as unknown as SupabaseClient;
  const { data, error } = await db
    .from("client_health_alerts")
    .select(
      "id, type, severity, title, message, clientId, deliveredAt, acknowledgedAt, createdAt",
    )
    .eq("user_id", userId)
    .order("createdAt", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = data as Array<{
    id: string;
    type: string;
    severity: string | null;
    title: string | null;
    message: string | null;
    clientId: string | null;
    deliveredAt: string | null;
    acknowledgedAt: string | null;
    createdAt: string;
  }>;

  const clientIds = Array.from(
    new Set(
      rows
        .map((r) => r.clientId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const nameById = new Map<string, string>();
  if (clientIds.length > 0) {
    const clients = await db
      .from("clients")
      .select("id, name")
      .in("id", clientIds);
    for (const row of (clients.data ?? []) as Array<{
      id: string | null;
      name: string | null;
    }>) {
      if (row.id && row.name) nameById.set(row.id, row.name);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    severity: row.severity ?? "critical",
    message: row.message ?? row.title ?? "",
    clientId: row.clientId,
    clientName: row.clientId ? nameById.get(row.clientId) ?? null : null,
    deliveredAt: row.deliveredAt,
    acknowledgedAt: row.acknowledgedAt,
    createdAt: row.createdAt,
  }));
}
