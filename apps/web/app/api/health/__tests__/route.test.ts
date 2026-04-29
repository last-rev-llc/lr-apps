import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runHealthChecks = vi.fn();
const aggregateStatus = vi.fn();

vi.mock("@/lib/health-checks", () => ({
  runHealthChecks: () => runHealthChecks(),
  aggregateStatus: (checks: unknown) => aggregateStatus(checks),
}));

import { GET } from "../route";

describe("GET /api/health", () => {
  beforeEach(() => {
    process.env.VERCEL_GIT_COMMIT_SHA = "abc1234deadbeef";
    process.env.DEPLOYMENT_ENV = "staging";
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.DEPLOYMENT_ENV;
  });

  it("returns 200 with status=ok when all checks pass", async () => {
    const checks = [
      { name: "supabase", status: "ok", latencyMs: 12 },
      { name: "stripe", status: "ok", latencyMs: 87 },
    ];
    runHealthChecks.mockResolvedValue(checks);
    aggregateStatus.mockReturnValue("ok");

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.version).toBe("abc1234deadbeef");
    expect(body.commit).toBe("abc1234");
    expect(body.env).toBe("staging");
    expect(body.checks).toEqual(checks);
    expect(typeof body.timestamp).toBe("string");
  });

  it("returns 503 with status=degraded when a dependency fails", async () => {
    const checks = [
      { name: "supabase", status: "ok", latencyMs: 12 },
      {
        name: "stripe",
        status: "degraded",
        latencyMs: 2003,
        error: "timeout",
      },
    ];
    runHealthChecks.mockResolvedValue(checks);
    aggregateStatus.mockReturnValue("degraded");

    const res = await GET();
    expect(res.status).toBe(503);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("degraded");
    const bodyChecks = body.checks as Array<Record<string, unknown>>;
    expect(bodyChecks).toHaveLength(2);
    expect(bodyChecks[1]?.status).toBe("degraded");
  });

  it("falls back to 'unknown' commit when env var is unset", async () => {
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    runHealthChecks.mockResolvedValue([
      { name: "supabase", status: "ok", latencyMs: 1 },
      { name: "stripe", status: "ok", latencyMs: 1 },
    ]);
    aggregateStatus.mockReturnValue("ok");

    const res = await GET();
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.version).toBe("unknown");
    expect(body.commit).toBe("unknown");
  });
});
