import { log } from "@repo/logger";
import { aggregateStatus, runHealthChecks } from "@/lib/health-checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const checks = await runHealthChecks();
  const status = aggregateStatus(checks);
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown";

  const payload = {
    status,
    version: commit,
    commit: commit !== "unknown" ? commit.slice(0, 7) : "unknown",
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    env: process.env.DEPLOYMENT_ENV ?? process.env.NODE_ENV ?? "unknown",
    timestamp: new Date().toISOString(),
    checks,
  };

  if (status === "degraded") {
    log.warn("health check degraded", {
      checks: checks.map((c) => ({ name: c.name, status: c.status })),
    });
  }

  return Response.json(payload, {
    status: status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
