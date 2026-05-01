"use server";

import { z } from "zod";
import { requireAccess } from "@repo/auth/server";
import { createClient } from "@repo/db/server";
import { FeatureAccessError } from "@repo/billing";
import { log } from "@repo/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import { withSpan } from "@/lib/otel";

// ─── updateAlertSettings ─────────────────────────────────────────────────────

const settingsSchema = z
  .object({
    emailEnabled: z.boolean(),
    alertEmail: z
      .union([z.string().email().max(254), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v == null || v === "" ? null : v)),
    sslWarnDays: z.number().int().min(1).max(365),
    healthDropThreshold: z.number().int().min(1).max(100),
  })
  .strict();

export type UpdateAlertSettingsInput = z.input<typeof settingsSchema>;

export type FieldErrors = Partial<
  Record<keyof z.infer<typeof settingsSchema>, string>
>;

export type UpdateAlertSettingsResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export async function updateAlertSettings(
  input: UpdateAlertSettingsInput,
): Promise<UpdateAlertSettingsResult> {
  return withSpan("client-health.updateAlertSettings", {}, async () => {
    const { user } = await requireAccess("client-health");

    const allowed = await enforceFeatureTier(user.id, "client-health:alerting");
    if (!allowed) throw new FeatureAccessError("client-health:alerting");

    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          typeof key === "string" &&
          ["emailEnabled", "alertEmail", "sslWarnDays", "healthDropThreshold"].includes(
            key,
          )
        ) {
          fieldErrors[key as keyof FieldErrors] = issue.message;
        }
      }
      return { ok: false, error: "invalid input", fieldErrors };
    }

    const db = (await createClient()) as unknown as SupabaseClient;
    const { error } = await db.from("client_health_settings").upsert(
      {
        user_id: user.id,
        emailEnabled: parsed.data.emailEnabled,
        alertEmail: parsed.data.alertEmail,
        sslWarnDays: parsed.data.sslWarnDays,
        healthDropThreshold: parsed.data.healthDropThreshold,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      log.error("client-health: settings upsert failed", {
        userId: user.id,
        err: error.message,
      });
      return { ok: false, error: error.message };
    }

    log.info("client-health: settings updated", { userId: user.id });
    return { ok: true };
  });
}

// ─── alert actions ──────────────────────────────────────────────────────────

const alertIdSchema = z.string().uuid();

export type AlertActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Marks an alert acknowledged by setting `acknowledgedAt = now()`. Scoped to
 * the caller's user_id so foreign acknowledgements are silently no-ops.
 */
export async function acknowledgeAlert(
  alertId: string,
): Promise<AlertActionResult> {
  return withSpan("client-health.acknowledgeAlert", {}, async () => {
    const { user } = await requireAccess("client-health");
    const allowed = await enforceFeatureTier(user.id, "client-health:alerting");
    if (!allowed) throw new FeatureAccessError("client-health:alerting");

    const parsed = alertIdSchema.safeParse(alertId);
    if (!parsed.success) return { ok: false, error: "invalid input" };

    const db = (await createClient()) as unknown as SupabaseClient;
    const { error } = await db
      .from("client_health_alerts")
      .update({ acknowledgedAt: new Date().toISOString() })
      .eq("id", parsed.data)
      .eq("user_id", user.id);

    if (error) {
      log.error("client-health: ack failed", {
        userId: user.id,
        alertId: parsed.data,
        err: error.message,
      });
      return { ok: false, error: error.message };
    }
    return { ok: true };
  });
}

const SNOOZE_HOURS_MIN = 1;
const SNOOZE_HOURS_MAX = 24 * 30; // cap at 30 days
const snoozeSchema = z.object({
  alertId: z.string().uuid(),
  hours: z
    .number()
    .int()
    .min(SNOOZE_HOURS_MIN)
    .max(SNOOZE_HOURS_MAX)
    .default(24),
});

/**
 * Snooze design: writes a future-dated `acknowledgedAt`. The cron's dedupe
 * check (`is acknowledgedAt null`) treats any non-null value — including a
 * future timestamp — as "already handled", so the alert won't fan out again
 * during the snooze window. We picked this over a separate `snoozedUntil`
 * column to avoid an additional migration; trade-off is that the UI must
 * distinguish "acknowledged in the past" from "snoozed until future" by
 * comparing acknowledgedAt against now.
 */
export async function snoozeAlert(
  alertId: string,
  hours: number = 24,
): Promise<AlertActionResult> {
  return withSpan("client-health.snoozeAlert", {}, async () => {
    const { user } = await requireAccess("client-health");
    const allowed = await enforceFeatureTier(user.id, "client-health:alerting");
    if (!allowed) throw new FeatureAccessError("client-health:alerting");

    const parsed = snoozeSchema.safeParse({ alertId, hours });
    if (!parsed.success) return { ok: false, error: "invalid input" };

    const until = new Date(
      Date.now() + parsed.data.hours * 60 * 60 * 1000,
    ).toISOString();

    const db = (await createClient()) as unknown as SupabaseClient;
    const { error } = await db
      .from("client_health_alerts")
      .update({ acknowledgedAt: until })
      .eq("id", parsed.data.alertId)
      .eq("user_id", user.id);

    if (error) {
      log.error("client-health: snooze failed", {
        userId: user.id,
        alertId: parsed.data.alertId,
        err: error.message,
      });
      return { ok: false, error: error.message };
    }
    return { ok: true };
  });
}
