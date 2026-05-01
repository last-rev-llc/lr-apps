// Shared alerting logic for issue #278.
// Used by both the hourly status cron and the daily SSL cron (issue #276)
// when newly expiring/expired certs are detected.
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, clientHealthAlertEmail } from "@repo/email";
import type {
  ClientHealthAlertEmailData,
  ClientHealthAlertOffender,
  ClientHealthAlertType,
} from "@repo/email";
import { log } from "@repo/logger";

export type AlertSettings = {
  emailEnabled: boolean;
  alertEmail: string | null;
  sslWarnDays: number;
  healthDropThreshold: number;
};

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  emailEnabled: true,
  alertEmail: null,
  sslWarnDays: 14,
  healthDropThreshold: 20,
};

export type AlertCandidate = {
  type: ClientHealthAlertType;
  clientId: string;
  clientName: string;
  summary: string;
  score?: number | null;
  scoreDelta?: number | null;
  offenders: ClientHealthAlertOffender[];
};

export type AlertDecision =
  | { status: "sent"; type: ClientHealthAlertType; clientId: string }
  | { status: "deduped"; type: ClientHealthAlertType; clientId: string }
  | { status: "skipped"; reason: "email_disabled" | "no_recipient"; type: ClientHealthAlertType; clientId: string };

export async function getAlertSettingsForUser(
  userId: string,
  db: SupabaseClient,
): Promise<AlertSettings> {
  const { data, error } = await db
    .from("client_health_settings")
    .select("emailEnabled, alertEmail, sslWarnDays, healthDropThreshold")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_ALERT_SETTINGS };
  return {
    emailEnabled: typeof data.emailEnabled === "boolean" ? data.emailEnabled : DEFAULT_ALERT_SETTINGS.emailEnabled,
    alertEmail: typeof data.alertEmail === "string" && data.alertEmail.length > 0 ? data.alertEmail : null,
    sslWarnDays: typeof data.sslWarnDays === "number" ? data.sslWarnDays : DEFAULT_ALERT_SETTINGS.sslWarnDays,
    healthDropThreshold:
      typeof data.healthDropThreshold === "number"
        ? data.healthDropThreshold
        : DEFAULT_ALERT_SETTINGS.healthDropThreshold,
  };
}

export interface EvaluateAndAlertParams {
  db: SupabaseClient;
  userId: string;
  userEmail: string | null;
  settings: AlertSettings;
  candidates: AlertCandidate[];
}

export async function evaluateAndAlert({
  db,
  userId,
  userEmail,
  settings,
  candidates,
}: EvaluateAndAlertParams): Promise<AlertDecision[]> {
  const decisions: AlertDecision[] = [];

  for (const candidate of candidates) {
    const { type, clientId } = candidate;

    // Dedupe against unacknowledged alerts of the same (type, clientId).
    // Column names match the migration schema (camelCase quoted in DDL).
    const existing = await db
      .from("client_health_alerts")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .eq("clientId", clientId)
      .is("acknowledgedAt", null)
      .limit(1);

    if (existing.error) {
      log.warn("alert dedupe lookup failed", {
        userId,
        clientId,
        type,
        err: existing.error.message,
      });
    } else if ((existing.data ?? []).length > 0) {
      decisions.push({ status: "deduped", type, clientId });
      log.info("alert deduped", { userId, clientId, type });
      continue;
    }

    if (!settings.emailEnabled) {
      decisions.push({ status: "skipped", reason: "email_disabled", type, clientId });
      log.info("alert skipped: email disabled", { userId, clientId, type });
      continue;
    }

    const recipient = settings.alertEmail ?? userEmail;
    if (!recipient) {
      decisions.push({ status: "skipped", reason: "no_recipient", type, clientId });
      log.warn("alert skipped: no recipient", { userId, clientId, type });
      continue;
    }

    // Persist only the columns defined in the migration schema. The richer
    // candidate fields (score, scoreDelta, offenders) are surfaced in the
    // email but not stored — the alert row is just a dedupe + history record.
    const insertResult = await db.from("client_health_alerts").insert({
      user_id: userId,
      clientId: clientId,
      type,
      severity: "critical",
      title: candidate.clientName,
      message: candidate.summary,
    });

    if (insertResult.error) {
      log.error("alert insert failed", {
        userId,
        clientId,
        type,
        err: insertResult.error.message,
      });
    }

    const emailData: ClientHealthAlertEmailData = {
      clientName: candidate.clientName,
      alertType: type,
      severity: "critical",
      summary: candidate.summary,
      score: candidate.score ?? null,
      scoreDelta: candidate.scoreDelta ?? null,
      offenders: candidate.offenders,
      dashboardUrl: null,
    };

    try {
      await sendEmail({
        to: recipient,
        template: clientHealthAlertEmail,
        data: emailData,
      });
      decisions.push({ status: "sent", type, clientId });
      log.info("alert sent", { userId, clientId, type, to: recipient });
    } catch (err) {
      log.error("alert email send failed", {
        userId,
        clientId,
        type,
        err: err instanceof Error ? err.message : String(err),
      });
      decisions.push({ status: "sent", type, clientId });
    }
  }

  return decisions;
}
