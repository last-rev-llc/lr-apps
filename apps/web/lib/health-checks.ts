import { createServiceRoleClient } from "@repo/db/service-role";
import { getStripe } from "@repo/billing/stripe-client";

export type CheckStatus = "ok" | "degraded";

export type HealthCheckResult = {
  name: string;
  status: CheckStatus;
  latencyMs: number;
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 2000;

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

export async function checkSupabase(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const client = createServiceRoleClient();
    await withTimeout(async (signal) => {
      const { error } = await client
        .from("app_permissions")
        .select("user_id")
        .limit(1)
        .abortSignal(signal);
      if (error) throw new Error(error.message);
    }, timeoutMs);
    return { name: "supabase", status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      name: "supabase",
      status: "degraded",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function checkStripe(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const stripe = getStripe();
    await withTimeout(async () => {
      // balance.retrieve is cheap, idempotent, and proves auth + reachability.
      await stripe.balance.retrieve();
    }, timeoutMs);
    return { name: "stripe", status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      name: "stripe",
      status: "degraded",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runHealthChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([checkSupabase(), checkStripe()]);
}

export function aggregateStatus(checks: HealthCheckResult[]): CheckStatus {
  return checks.every((c) => c.status === "ok") ? "ok" : "degraded";
}
