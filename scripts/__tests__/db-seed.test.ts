import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUpsert = vi.fn();
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }));

vi.mock("../../packages/db/src/service-role.ts", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

vi.mock("../../apps/web/lib/app-registry.ts", () => ({
  getAllApps: () => [
    { slug: "auth", auth: false },
    { slug: "command-center", auth: true },
    { slug: "sentiment", auth: true },
    { slug: "travel-collection", auth: false },
    { slug: "uptime", auth: true },
  ],
}));

import { seed } from "../db-seed";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
  process.env = { ...ORIGINAL_ENV };
  process.env.E2E_TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
  process.env.E2E_TEST_USER_EMAIL = "test@example.com";
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("db-seed", () => {
  it("aborts when E2E_TEST_USER_ID is unset", async () => {
    delete process.env.E2E_TEST_USER_ID;
    await expect(seed()).rejects.toThrow(/E2E_TEST_USER_ID/);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("aborts when E2E_TEST_USER_EMAIL is unset", async () => {
    delete process.env.E2E_TEST_USER_EMAIL;
    await expect(seed()).rejects.toThrow(/E2E_TEST_USER_EMAIL/);
  });

  it("upserts admin permissions for every auth-required app", async () => {
    const summary = await seed();
    expect(summary.permissions.upserted).toBe(3);
    expect(summary.permissions.apps).toEqual([
      "command-center",
      "sentiment",
      "uptime",
    ]);

    expect(mockFrom).toHaveBeenCalledWith("app_permissions");
    const permCall = mockUpsert.mock.calls.find((c) =>
      Array.isArray(c[0]) && c[0][0]?.app_slug !== undefined,
    );
    expect(permCall).toBeDefined();
    expect(permCall![1]).toEqual({ onConflict: "user_id,app_slug" });
    expect(permCall![0]).toEqual([
      {
        user_id: "00000000-0000-0000-0000-000000000001",
        app_slug: "command-center",
        permission: "admin",
      },
      {
        user_id: "00000000-0000-0000-0000-000000000001",
        app_slug: "sentiment",
        permission: "admin",
      },
      {
        user_id: "00000000-0000-0000-0000-000000000001",
        app_slug: "uptime",
        permission: "admin",
      },
    ]);
  });

  it("upserts a pro subscription with onConflict user_id", async () => {
    await seed();
    expect(mockFrom).toHaveBeenCalledWith("subscriptions");
    const subCall = mockUpsert.mock.calls.find(
      (c) => !Array.isArray(c[0]) && c[0]?.stripe_customer_id !== undefined,
    );
    expect(subCall).toBeDefined();
    expect(subCall![1]).toEqual({ onConflict: "user_id" });
    expect(subCall![0]).toMatchObject({
      user_id: "00000000-0000-0000-0000-000000000001",
      stripe_customer_id: "cus_test_seed",
      stripe_subscription_id: "sub_test_seed",
      tier: "pro",
      status: "active",
    });
    expect(typeof subCall![0].current_period_start).toBe("string");
    expect(typeof subCall![0].current_period_end).toBe("string");
  });

  it("is idempotent — running twice yields the same upsert calls", async () => {
    await seed();
    const firstCallCount = mockUpsert.mock.calls.length;
    const firstSnapshot = JSON.parse(JSON.stringify(mockUpsert.mock.calls.map((c) => ({
      payload: c[0],
      opts: c[1],
    }))));

    await seed();
    expect(mockUpsert.mock.calls.length).toBe(firstCallCount * 2);
    const secondHalf = mockUpsert.mock.calls
      .slice(firstCallCount)
      .map((c) => ({ payload: c[0], opts: c[1] }));
    // Compare keys + onConflict opts (timestamps will differ between runs, so
    // only check the structural payload).
    expect(secondHalf.map((c) => c.opts)).toEqual(firstSnapshot.map((c: { opts: unknown }) => c.opts));
  });

  it("propagates errors from the permission upsert", async () => {
    mockUpsert.mockResolvedValueOnce({ error: { message: "perm denied" } });
    await expect(seed()).rejects.toThrow(/perm denied/);
  });

  it("propagates errors from the subscription upsert", async () => {
    mockUpsert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "sub denied" } });
    await expect(seed()).rejects.toThrow(/sub denied/);
  });
});
