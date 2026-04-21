import { describe, it, expect, vi } from "vitest";
import { createMockSupabase } from "@repo/test-utils";
import {
  getAppPermission,
  getUserSubscription,
  upsertPermission,
} from "../queries";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types";

function asClient(mock: ReturnType<typeof createMockSupabase>): SupabaseClient<Database> {
  return mock as unknown as SupabaseClient<Database>;
}

describe("queries edge cases — typed errors and graceful degradation", () => {
  describe("network failure", () => {
    it("getAppPermission throws on network error (no fake null)", async () => {
      const mock = createMockSupabase();
      mock._builder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "fetch failed", code: "ENETDOWN" },
      });
      await expect(
        getAppPermission(asClient(mock), "u1", "sentiment"),
      ).rejects.toMatchObject({ message: "fetch failed" });
    });

    it("getUserSubscription surfaces network errors instead of returning null", async () => {
      const mock = createMockSupabase();
      mock._builder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "network timeout" },
      });
      await expect(getUserSubscription(asClient(mock), "u1")).rejects.toMatchObject(
        { message: "network timeout" },
      );
    });
  });

  describe("RLS denial", () => {
    it("getAppPermission surfaces PGRST 42501 (insufficient privilege)", async () => {
      const mock = createMockSupabase();
      mock._builder.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: "42501", message: "permission denied for table" },
      });
      await expect(
        getAppPermission(asClient(mock), "u1", "sentiment"),
      ).rejects.toMatchObject({ code: "42501" });
    });

    it("upsertPermission surfaces RLS violation on write", async () => {
      const mock = createMockSupabase();
      mock._builder.single.mockResolvedValue({
        data: null,
        error: { code: "42501", message: "new row violates row-level security policy" },
      });
      await expect(
        upsertPermission(asClient(mock), "u1", "sentiment", "view"),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  describe("malformed responses", () => {
    it("getAppPermission returns null when data has no permission field (defensive optional chain)", async () => {
      const mock = createMockSupabase();
      mock._builder.maybeSingle.mockResolvedValue({
        data: { permission: null },
        error: null,
      });
      await expect(
        getAppPermission(asClient(mock), "u1", "sentiment"),
      ).resolves.toBeNull();
    });

    it("getAppPermission returns null when row is absent (maybeSingle returns null data)", async () => {
      const mock = createMockSupabase();
      mock._builder.maybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(
        getAppPermission(asClient(mock), "u1", "sentiment"),
      ).resolves.toBeNull();
    });
  });
});

describe("createServerClient survives missing cookies", () => {
  // Testing the server.ts createClient must not crash when the cookie jar is empty.
  it("invokes createServerClient even when next/headers returns no cookies", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const mockCreateServerClient = vi.fn(() => ({ from: vi.fn(), auth: {} }));
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: mockCreateServerClient,
    }));
    vi.doMock("next/headers", () => ({
      cookies: vi.fn().mockResolvedValue({
        getAll: () => [],
        set: vi.fn(),
      }),
    }));

    const { createClient } = await import("../server");
    await expect(createClient()).resolves.toBeDefined();
    expect(mockCreateServerClient).toHaveBeenCalled();
  });
});
