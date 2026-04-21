import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseAbortSignal = vi.fn();
const supabaseLimit = vi.fn(() => ({ abortSignal: supabaseAbortSignal }));
const supabaseSelect = vi.fn(() => ({ limit: supabaseLimit }));
const supabaseFrom = vi.fn(() => ({ select: supabaseSelect }));

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: supabaseFrom }),
}));

const stripeBalanceRetrieve = vi.fn();
vi.mock("@repo/billing/stripe-client", () => ({
  getStripe: () => ({ balance: { retrieve: stripeBalanceRetrieve } }),
}));

import {
  aggregateStatus,
  checkStripe,
  checkSupabase,
  runHealthChecks,
} from "../health-checks";

describe("health-checks", () => {
  beforeEach(() => {
    supabaseAbortSignal.mockResolvedValue({ data: [], error: null });
    stripeBalanceRetrieve.mockResolvedValue({ available: [], pending: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("checkSupabase", () => {
    it("returns ok when Supabase responds", async () => {
      const result = await checkSupabase();
      expect(result).toMatchObject({ name: "supabase", status: "ok" });
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("returns degraded with error message when Supabase errors", async () => {
      supabaseAbortSignal.mockResolvedValue({
        data: null,
        error: { message: "schema unreachable" },
      });
      const result = await checkSupabase();
      expect(result.status).toBe("degraded");
      expect(result.error).toContain("schema unreachable");
    });

    it("returns degraded when Supabase throws", async () => {
      supabaseAbortSignal.mockRejectedValue(new Error("connection refused"));
      const result = await checkSupabase();
      expect(result.status).toBe("degraded");
      expect(result.error).toBe("connection refused");
    });
  });

  describe("checkStripe", () => {
    it("returns ok when Stripe responds", async () => {
      const result = await checkStripe();
      expect(result).toMatchObject({ name: "stripe", status: "ok" });
    });

    it("returns degraded when Stripe throws", async () => {
      stripeBalanceRetrieve.mockRejectedValue(new Error("invalid api key"));
      const result = await checkStripe();
      expect(result.status).toBe("degraded");
      expect(result.error).toBe("invalid api key");
    });
  });

  describe("runHealthChecks + aggregateStatus", () => {
    it("returns ok when all checks pass", async () => {
      const checks = await runHealthChecks();
      expect(checks).toHaveLength(2);
      expect(aggregateStatus(checks)).toBe("ok");
    });

    it("returns degraded when any check fails", async () => {
      stripeBalanceRetrieve.mockRejectedValue(new Error("down"));
      const checks = await runHealthChecks();
      expect(aggregateStatus(checks)).toBe("degraded");
      const stripe = checks.find((c) => c.name === "stripe");
      expect(stripe?.status).toBe("degraded");
    });
  });
});
