import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types";
import { logAuditEvent } from "../audit";

function mockClient(insertResult: { error: unknown } = { error: null }) {
  const insert = vi.fn().mockResolvedValue(insertResult);
  const from = vi.fn().mockReturnValue({ insert });
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    insert,
    from,
  };
}

const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  consoleErrorSpy.mockClear();
});

describe("logAuditEvent", () => {
  it("inserts the expected row shape", async () => {
    const { client, insert, from } = mockClient();

    await logAuditEvent(client, {
      userId: "user-1",
      action: "subscription.created",
      resource: "sub_abc",
      metadata: { priceId: "price_pro_monthly" },
      ipAddress: "1.2.3.4",
      userAgent: "curl/8",
    });

    expect(from).toHaveBeenCalledWith("audit_log");
    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      action: "subscription.created",
      resource: "sub_abc",
      metadata: { priceId: "price_pro_monthly" },
      ip_address: "1.2.3.4",
      user_agent: "curl/8",
    });
  });

  it("defaults optional fields to null / empty metadata", async () => {
    const { client, insert } = mockClient();

    await logAuditEvent(client, { action: "checkout.session.created" });

    expect(insert).toHaveBeenCalledWith({
      user_id: null,
      action: "checkout.session.created",
      resource: null,
      metadata: {},
      ip_address: null,
      user_agent: null,
    });
  });

  it("swallows database errors and logs them", async () => {
    const { client } = mockClient({ error: { message: "RLS denied" } });

    await expect(
      logAuditEvent(client, { action: "subscription.updated" }),
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "logAuditEvent failed",
      expect.objectContaining({ action: "subscription.updated" }),
    );
  });

  it("swallows thrown errors and logs them", async () => {
    const client = {
      from: vi.fn(() => {
        throw new Error("network down");
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(
      logAuditEvent(client, { action: "login" }),
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "logAuditEvent threw",
      expect.objectContaining({ action: "login" }),
    );
  });
});
