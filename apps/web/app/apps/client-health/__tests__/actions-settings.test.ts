import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { TEST_USER_ID } = vi.hoisted(() => ({
  TEST_USER_ID: "11111111-1111-4111-8111-111111111111",
}));

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn().mockResolvedValue({
    user: { id: TEST_USER_ID, email: "user@example.com" },
    permission: "view",
  }),
}));

type Row = Record<string, unknown> & { user_id: string };
let store: Row[] = [];
const upsertCalls: Array<Record<string, unknown>> = [];

const mockDb = {
  from(table: string) {
    if (table !== "client_health_settings") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      upsert: async (
        row: Record<string, unknown>,
        opts?: { onConflict?: string },
      ) => {
        upsertCalls.push(row);
        void opts;
        const idx = store.findIndex(
          (r) => r.user_id === row.user_id,
        );
        if (idx >= 0) store[idx] = { ...store[idx], ...row };
        else store.push(row as Row);
        return { error: null };
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

import { updateAlertSettings } from "../lib/actions";
import { FeatureAccessError } from "@repo/billing";

beforeEach(() => {
  store = [];
  upsertCalls.length = 0;
  vi.clearAllMocks();
  enforceFeatureTierMock.mockResolvedValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateAlertSettings", () => {
  it("upserts a valid payload keyed on the session user_id", async () => {
    const result = await updateAlertSettings({
      emailEnabled: true,
      alertEmail: "alerts@example.com",
      sslWarnDays: 14,
      healthDropThreshold: 20,
    });
    expect(result).toEqual({ ok: true });
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]).toMatchObject({
      user_id: TEST_USER_ID,
      emailEnabled: true,
      alertEmail: "alerts@example.com",
      sslWarnDays: 14,
      healthDropThreshold: 20,
    });
  });

  it("normalizes empty alertEmail to null", async () => {
    const result = await updateAlertSettings({
      emailEnabled: false,
      alertEmail: "",
      sslWarnDays: 7,
      healthDropThreshold: 10,
    });
    expect(result).toEqual({ ok: true });
    expect(upsertCalls[0]).toMatchObject({ alertEmail: null });
  });

  it("rejects sslWarnDays below 1", async () => {
    const result = await updateAlertSettings({
      emailEnabled: true,
      sslWarnDays: 0,
      healthDropThreshold: 20,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid input");
      expect(result.fieldErrors?.sslWarnDays).toBeTruthy();
    }
    expect(upsertCalls).toHaveLength(0);
  });

  it("rejects sslWarnDays above 365", async () => {
    const result = await updateAlertSettings({
      emailEnabled: true,
      sslWarnDays: 366,
      healthDropThreshold: 20,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.sslWarnDays).toBeTruthy();
    }
  });

  it("rejects healthDropThreshold above 100", async () => {
    const result = await updateAlertSettings({
      emailEnabled: true,
      sslWarnDays: 14,
      healthDropThreshold: 101,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.healthDropThreshold).toBeTruthy();
    }
  });

  it("rejects an invalid email", async () => {
    const result = await updateAlertSettings({
      emailEnabled: true,
      alertEmail: "not-an-email",
      sslWarnDays: 14,
      healthDropThreshold: 20,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.alertEmail).toBeTruthy();
    }
  });

  it("throws FeatureAccessError when the gate denies", async () => {
    enforceFeatureTierMock.mockResolvedValueOnce(false);
    await expect(
      updateAlertSettings({
        emailEnabled: true,
        sslWarnDays: 14,
        healthDropThreshold: 20,
      }),
    ).rejects.toBeInstanceOf(FeatureAccessError);
    expect(upsertCalls).toHaveLength(0);
  });

  it("rejects extra unknown keys via strict()", async () => {
    const result = await updateAlertSettings({
      emailEnabled: true,
      sslWarnDays: 14,
      healthDropThreshold: 20,
      // @ts-expect-error — extra key
      user_id: "should-be-rejected",
    });
    expect(result.ok).toBe(false);
  });
});
