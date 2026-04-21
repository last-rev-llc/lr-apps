import { describe, it, expect, vi } from "vitest";
import {
  getAppPermission,
  getUserSubscription,
  upsertPermission,
  insertAuditLog,
} from "../queries";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AppPermission, SubscriptionRow } from "../types";

function mockClient(result: { data: unknown; error: unknown }) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    insert: vi.fn().mockResolvedValue(result),
  };
  return chain as unknown as SupabaseClient<Database>;
}

describe("getAppPermission", () => {
  it("returns permission when found", async () => {
    const client = mockClient({ data: { permission: "edit" }, error: null });
    const result = await getAppPermission(client, "user-1", "command-center");
    expect(result).toBe("edit");
  });

  it("returns null when no row found", async () => {
    const client = mockClient({ data: null, error: null });
    const result = await getAppPermission(client, "user-1", "unknown-app");
    expect(result).toBeNull();
  });

  it("throws on error", async () => {
    const client = mockClient({ data: null, error: new Error("db error") });
    await expect(getAppPermission(client, "user-1", "app")).rejects.toThrow("db error");
  });

  it("calls correct table and filters", async () => {
    const client = mockClient({ data: { permission: "view" }, error: null });
    await getAppPermission(client, "user-1", "my-app");

    expect(client.from).toHaveBeenCalledWith("app_permissions");
    expect(client.select).toHaveBeenCalledWith("permission");
    expect(client.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(client.eq).toHaveBeenCalledWith("app_slug", "my-app");
  });
});

describe("getUserSubscription", () => {
  const mockSub: SubscriptionRow = {
    id: "sub-1",
    user_id: "user-1",
    stripe_customer_id: "cus_123",
    stripe_subscription_id: "sub_123",
    status: "active",
    plan: "pro",
    current_period_start: "2026-01-01T00:00:00Z",
    current_period_end: "2026-02-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("returns subscription when found", async () => {
    const client = mockClient({ data: mockSub, error: null });
    const result = await getUserSubscription(client, "user-1");
    expect(result).toEqual(mockSub);
  });

  it("returns null when no subscription", async () => {
    const client = mockClient({ data: null, error: null });
    const result = await getUserSubscription(client, "user-1");
    expect(result).toBeNull();
  });

  it("throws on error", async () => {
    const client = mockClient({ data: null, error: new Error("timeout") });
    await expect(getUserSubscription(client, "user-1")).rejects.toThrow("timeout");
  });

  it("calls correct table and filter", async () => {
    const client = mockClient({ data: mockSub, error: null });
    await getUserSubscription(client, "user-1");

    expect(client.from).toHaveBeenCalledWith("subscriptions");
    expect(client.select).toHaveBeenCalledWith("*");
    expect(client.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});

describe("upsertPermission", () => {
  const mockRow: AppPermission = {
    id: "perm-1",
    user_id: "user-1",
    app_slug: "my-app",
    permission: "admin",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("returns upserted permission", async () => {
    const client = mockClient({ data: mockRow, error: null });
    const result = await upsertPermission(client, "user-1", "my-app", "admin");
    expect(result).toEqual(mockRow);
  });

  it("throws on error", async () => {
    const client = mockClient({ data: null, error: new Error("conflict") });
    await expect(upsertPermission(client, "user-1", "app", "view")).rejects.toThrow("conflict");
  });

  it("calls upsert with correct payload and conflict key", async () => {
    const client = mockClient({ data: mockRow, error: null });
    await upsertPermission(client, "user-1", "my-app", "admin");

    expect(client.from).toHaveBeenCalledWith("app_permissions");
    expect(client.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", app_slug: "my-app", permission: "admin" },
      { onConflict: "user_id,app_slug" },
    );
    expect(client.select).toHaveBeenCalled();
  });
});

describe("insertAuditLog", () => {
  const entry = {
    user_id: "user-1",
    action: "view",
    resource: "command-center:dashboard",
    metadata: { extra: "info" },
  };

  it("passes the row through to .from('audit_log').insert(entry)", async () => {
    const client = mockClient({ data: null, error: null });
    await insertAuditLog(client, entry);

    expect(client.from).toHaveBeenCalledWith("audit_log");
    expect(client.insert).toHaveBeenCalledWith(entry);
  });

  it("rejects on error", async () => {
    const client = mockClient({ data: null, error: new Error("rls denied") });
    await expect(insertAuditLog(client, entry)).rejects.toThrow("rls denied");
  });

  it("resolves to undefined on success", async () => {
    const client = mockClient({ data: null, error: null });
    await expect(insertAuditLog(client, entry)).resolves.toBeUndefined();
  });
});
