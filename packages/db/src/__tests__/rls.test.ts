import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { withAuthContext, getRlsHarnessConfig } from "@repo/test-utils";

// This suite runs against a local `supabase start` instance and asserts
// cross-tenant RLS denial. Skip if SUPABASE_TEST_URL is unset so local devs
// without supabase running aren't blocked.
const config = getRlsHarnessConfig();
const describeIfRls = config ? describe : describe.skip;

const USER_A = "00000000-0000-0000-0000-00000000000a";
const USER_B = "00000000-0000-0000-0000-00000000000b";

describeIfRls("RLS cross-tenant denial", () => {
  beforeAll(async () => {
    if (!config) return;
    const serviceKey = process.env["SUPABASE_TEST_SERVICE_ROLE_KEY"];
    if (!serviceKey) {
      throw new Error(
        "SUPABASE_TEST_SERVICE_ROLE_KEY required to seed RLS test data",
      );
    }
    const admin = createClient(config.url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Best-effort seed: ensure each user has at least one app_permission and
    // one subscription row. Tests assert isolation regardless of how many
    // rows exist.
    await admin.from("app_permissions").upsert(
      [
        { user_id: USER_A, app_slug: "command-center", permission: "view" },
        { user_id: USER_B, app_slug: "command-center", permission: "view" },
      ],
      { onConflict: "user_id,app_slug" },
    );
    await admin.from("subscriptions").upsert(
      [
        { user_id: USER_A, tier: "free", status: "active" },
        { user_id: USER_B, tier: "free", status: "active" },
      ],
      { onConflict: "user_id" },
    );
  });

  describe("app_permissions", () => {
    it("user A cannot SELECT user B's rows", async () => {
      const rows = await withAuthContext(USER_A, async (client) => {
        const { data, error } = await client
          .from("app_permissions")
          .select("*")
          .eq("user_id", USER_B);
        expect(error).toBeNull();
        return data ?? [];
      });
      expect(rows).toHaveLength(0);
    });
  });

  describe("subscriptions", () => {
    it("user A cannot SELECT user B's subscription", async () => {
      const rows = await withAuthContext(USER_A, async (client) => {
        const { data, error } = await client
          .from("subscriptions")
          .select("*")
          .eq("user_id", USER_B);
        expect(error).toBeNull();
        return data ?? [];
      });
      expect(rows).toHaveLength(0);
    });
  });

  describe("audit_log", () => {
    it("user A can INSERT a row with their own user_id", async () => {
      const error = await withAuthContext(USER_A, async (client) => {
        const { error } = await client.from("audit_log").insert({
          user_id: USER_A,
          action: "view",
          resource: "rls-test",
        });
        return error;
      });
      expect(error).toBeNull();
    });

    it("user A cannot INSERT a row impersonating user B", async () => {
      const error = await withAuthContext(USER_A, async (client) => {
        const { error } = await client.from("audit_log").insert({
          user_id: USER_B,
          action: "view",
          resource: "rls-test",
        });
        return error;
      });
      expect(error).not.toBeNull();
    });

    it("user A cannot SELECT any rows (including their own)", async () => {
      const rows = await withAuthContext(USER_A, async (client) => {
        const { data } = await client.from("audit_log").select("*");
        return data ?? [];
      });
      expect(rows).toHaveLength(0);
    });
  });
});
