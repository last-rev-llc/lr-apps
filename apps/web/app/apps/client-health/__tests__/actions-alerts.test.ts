import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { TEST_USER_ID, OTHER_USER_ID } = vi.hoisted(() => ({
  TEST_USER_ID: "11111111-1111-4111-8111-111111111111",
  OTHER_USER_ID: "22222222-2222-4222-8222-222222222222",
}));

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn().mockResolvedValue({
    user: { id: TEST_USER_ID, email: "user@example.com" },
    permission: "view",
  }),
}));

type Row = Record<string, unknown> & { id: string; user_id: string };
let store: Row[] = [];

function makeUpdateChain(patch: Record<string, unknown>) {
  const filters: Array<(r: Row) => boolean> = [];
  const chain: Record<string, unknown> & PromiseLike<{ error: null }> = {
    eq(col: string, val: unknown) {
      filters.push((r) => r[col] === val);
      return chain;
    },
    then(resolve: (v: { error: null }) => unknown) {
      const target = store.filter((r) => filters.every((f) => f(r)));
      for (const row of target) Object.assign(row, patch);
      return resolve({ error: null });
    },
  } as unknown as Record<string, unknown> & PromiseLike<{ error: null }>;
  return chain;
}

const mockDb = {
  from(table: string) {
    if (table !== "client_health_alerts") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      update(patch: Record<string, unknown>) {
        return makeUpdateChain(patch);
      },
    };
  },
};

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => mockDb),
}));

const enforceFeatureTierMock = vi.fn().mockResolvedValue(true);
vi.mock("@/lib/enforce-feature-tier", () => ({
  enforceFeatureTier: (...args: unknown[]) => enforceFeatureTierMock(...args),
}));

import { acknowledgeAlert, snoozeAlert } from "../lib/actions";
import { FeatureAccessError } from "@repo/billing";

const ALERT_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  store = [];
  vi.clearAllMocks();
  enforceFeatureTierMock.mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("acknowledgeAlert", () => {
  it("sets acknowledgedAt to now() for the user's own alert", async () => {
    store.push({
      id: ALERT_ID,
      user_id: TEST_USER_ID,
      type: "ssl-expiring",
      acknowledgedAt: null,
    });
    const before = Date.now();
    const result = await acknowledgeAlert(ALERT_ID);
    expect(result).toEqual({ ok: true });
    const ackAt = new Date(store[0].acknowledgedAt as string).getTime();
    expect(ackAt).toBeGreaterThanOrEqual(before - 100);
    expect(ackAt).toBeLessThanOrEqual(Date.now() + 100);
  });

  it("does not update an alert owned by another user", async () => {
    store.push({
      id: ALERT_ID,
      user_id: OTHER_USER_ID,
      type: "ssl-expiring",
      acknowledgedAt: null,
    });
    const result = await acknowledgeAlert(ALERT_ID);
    expect(result).toEqual({ ok: true });
    expect(store[0].acknowledgedAt).toBeNull();
  });

  it("rejects an invalid UUID", async () => {
    const result = await acknowledgeAlert("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "invalid input" });
  });

  it("throws FeatureAccessError when the gate denies", async () => {
    enforceFeatureTierMock.mockResolvedValueOnce(false);
    await expect(acknowledgeAlert(ALERT_ID)).rejects.toBeInstanceOf(
      FeatureAccessError,
    );
  });
});

describe("snoozeAlert", () => {
  it("writes a future-dated acknowledgedAt 24h in the future by default", async () => {
    store.push({
      id: ALERT_ID,
      user_id: TEST_USER_ID,
      type: "ssl-expiring",
      acknowledgedAt: null,
    });
    const before = Date.now();
    const result = await snoozeAlert(ALERT_ID);
    expect(result).toEqual({ ok: true });
    const until = new Date(store[0].acknowledgedAt as string).getTime();
    expect(until).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000 - 200);
    expect(until).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60 * 1000 + 200);
  });

  it("supports a custom hour count", async () => {
    store.push({
      id: ALERT_ID,
      user_id: TEST_USER_ID,
      type: "ssl-expiring",
      acknowledgedAt: null,
    });
    const before = Date.now();
    const result = await snoozeAlert(ALERT_ID, 4);
    expect(result).toEqual({ ok: true });
    const until = new Date(store[0].acknowledgedAt as string).getTime();
    expect(until).toBeGreaterThanOrEqual(before + 4 * 60 * 60 * 1000 - 200);
    expect(until).toBeLessThanOrEqual(Date.now() + 4 * 60 * 60 * 1000 + 200);
  });

  it("rejects hours below 1", async () => {
    const result = await snoozeAlert(ALERT_ID, 0);
    expect(result).toEqual({ ok: false, error: "invalid input" });
  });

  it("rejects hours above the 30-day cap", async () => {
    const result = await snoozeAlert(ALERT_ID, 24 * 31);
    expect(result).toEqual({ ok: false, error: "invalid input" });
  });

  it("rejects an invalid alertId", async () => {
    const result = await snoozeAlert("not-a-uuid", 24);
    expect(result).toEqual({ ok: false, error: "invalid input" });
  });

  it("throws FeatureAccessError when the gate denies", async () => {
    enforceFeatureTierMock.mockResolvedValueOnce(false);
    await expect(snoozeAlert(ALERT_ID, 24)).rejects.toBeInstanceOf(
      FeatureAccessError,
    );
  });
});
