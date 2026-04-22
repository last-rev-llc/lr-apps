import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type AuditEvent = {
  userId?: string | null;
  action: string;
  resource?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Write an audit-log row. Failures are swallowed and logged to the console
 * so audit instrumentation never takes down the caller's flow. Requires
 * a service-role client because the `audit_log` table has no insert policy.
 */
export async function logAuditEvent(
  client: SupabaseClient<Database>,
  event: AuditEvent,
): Promise<void> {
  try {
    const row: Database["public"]["Tables"]["audit_log"]["Insert"] = {
      user_id: event.userId ?? null,
      action: event.action,
      resource: event.resource ?? null,
      metadata: event.metadata ?? {},
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null,
    };
    const { error } = await client.from("audit_log").insert(row);
    if (error) {
      console.error("logAuditEvent failed", {
        action: event.action,
        error: error.message,
      });
    }
  } catch (err) {
    console.error("logAuditEvent threw", {
      action: event.action,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
