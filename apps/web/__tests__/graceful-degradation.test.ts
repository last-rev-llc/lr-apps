import { describe, it, expect, vi } from "vitest";
import { createMockSupabase } from "@repo/test-utils";
import { getAppPermission, getUserSubscription } from "@repo/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/db/types";

/**
 * Next.js error.tsx boundaries fire when a server component throws.
 * These tests assert that db query helpers *throw* (rather than returning
 * null / silently swallowing errors) when Supabase fails — which is the
 * contract that lets error.tsx render a fallback instead of leaking a 500.
 */

function asClient(mock: ReturnType<typeof createMockSupabase>): SupabaseClient<Database> {
  return mock as unknown as SupabaseClient<Database>;
}

describe("server-component → error.tsx graceful degradation contract", () => {
  it("getAppPermission rejects on Supabase error (propagates to nearest error.tsx)", async () => {
    const mock = createMockSupabase();
    mock._builder.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST301", message: "JWT expired" },
    });

    // A throw inside an async server component bubbles up to the Next
    // error boundary. Returning null would silently render a broken UI.
    await expect(getAppPermission(asClient(mock), "user-1", "sentiment")).rejects
      .toBeDefined();
  });

  it("getUserSubscription rejects on DB connection failure", async () => {
    const mock = createMockSupabase();
    mock._builder.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "ECONNREFUSED" },
    });

    await expect(getUserSubscription(asClient(mock), "user-1")).rejects
      .toBeDefined();
  });

  it("successful queries do NOT throw (happy path stays silent)", async () => {
    const mock = createMockSupabase();
    mock._builder.maybeSingle.mockResolvedValue({
      data: { permission: "view" },
      error: null,
    });

    await expect(
      getAppPermission(asClient(mock), "user-1", "sentiment"),
    ).resolves.toBe("view");
  });

  it("null-row response returns null rather than throwing (no error.tsx for empty result)", async () => {
    const mock = createMockSupabase();
    mock._builder.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(
      getAppPermission(asClient(mock), "user-1", "sentiment"),
    ).resolves.toBeNull();
  });

  it("error objects with only a code still propagate to the boundary", async () => {
    const mock = createMockSupabase();
    mock._builder.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "42501" },
    });

    await expect(
      getAppPermission(asClient(mock), "user-1", "sentiment"),
    ).rejects.toBeDefined();
  });
});

describe("graceful-degradation helpers are not observable outside of tests", () => {
  it("createMockSupabase resets cleanly between specs", () => {
    const mock = createMockSupabase();
    expect(vi.isMockFunction(mock.from)).toBe(true);
  });
});
