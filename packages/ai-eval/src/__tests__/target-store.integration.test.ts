// @vitest-environment node
//
// Integration test for the chatflow_targets encryption boundary.
//
// Skipped unless SUPABASE_TEST_URL is set, so the default `pnpm test` stays
// hermetic. A dedicated CI job (`ai-eval-integration` in
// .github/workflows/ci.yml) starts a local Supabase, applies migrations, seeds
// a pgsodium key via `pnpm seed:pgsodium-key`, exports the env vars below,
// then runs this suite.
//
// Required env vars (all set by the CI job; locally use `supabase start` +
// `pnpm tsx scripts/seed-pgsodium-key.ts`):
//   SUPABASE_TEST_URL                — local Supabase URL (e.g. http://127.0.0.1:54321)
//   SUPABASE_TEST_SERVICE_ROLE_KEY   — service-role key for admin ops
//   SUPABASE_TEST_ANON_KEY           — anon key (for RLS-bound clients)
//   PGSODIUM_KEY_ID                  — UUID of the seeded pgsodium key
//   SUPABASE_TEST_DB_URL             — postgres URL for direct SQL (Case 5 only)
//
// Rotation behaviour the test asserts (see docs/ops/chatflow-eval-rotation.md):
//   per-row `api_token_key_id` makes prior rows decryptable under the *old*
//   key id until they're explicitly rewritten. Deleting an old key would
//   cause decrypts to fail loudly — that branch is documented but not
//   exercised here so we don't leave a half-broken key in the test DB.

import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));

const TEST_URL = process.env.SUPABASE_TEST_URL;
const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY;
const KEY_ID = process.env.PGSODIUM_KEY_ID;
const DB_URL = process.env.SUPABASE_TEST_DB_URL;

const HAS_ENV = Boolean(TEST_URL && SERVICE_KEY && ANON_KEY && KEY_ID);

function execSql(sql: string): string[] {
  if (!DB_URL) {
    throw new Error(
      "SUPABASE_TEST_DB_URL is required for SQL helpers (Case 5 rotation)",
    );
  }
  const result = spawnSync(
    "psql",
    [DB_URL, "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.error) throw result.error;
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(
      `psql exited ${result.status}: ${result.stderr?.toString().trim()}`,
    );
  }
  return (result.stdout?.toString() ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

describe.skipIf(!HAS_ENV)(
  "target-store encryption boundary (integration)",
  () => {
    const ORIGINAL_ENV = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      PGSODIUM_KEY_ID: process.env.PGSODIUM_KEY_ID,
    };

    const userIdA = "00000000-0000-4000-8000-0000000000aa";
    const userIdB = "00000000-0000-4000-8000-0000000000bb";
    const emailA = "ai-eval-integration-a@test.local";
    const emailB = "ai-eval-integration-b@test.local";
    const password = "integration-test-pw-7HgX";

    let admin!: ReturnType<typeof createClient>;
    let store!: typeof import("../target-store");

    beforeAll(async () => {
      // Re-point the @repo/db service-role factory at the test Supabase.
      // target-store reads env at call time, so setting these before the
      // dynamic import below is sufficient.
      process.env.NEXT_PUBLIC_SUPABASE_URL = TEST_URL!;
      process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY!;
      process.env.PGSODIUM_KEY_ID = KEY_ID!;

      admin = createClient(TEST_URL!, SERVICE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      for (const [id, email] of [
        [userIdA, emailA],
        [userIdB, emailB],
      ] as const) {
        await admin.auth.admin.deleteUser(id).catch(() => {});
        const { error } = await admin.auth.admin.createUser({
          id,
          email,
          email_confirm: true,
          password,
        });
        if (error) {
          throw new Error(
            `failed to seed test user ${email}: ${error.message}`,
          );
        }
      }

      store = await import("../target-store");
    });

    afterEach(async () => {
      await admin
        .from("chatflow_targets")
        .delete()
        .in("user_id", [userIdA, userIdB]);
    });

    afterAll(async () => {
      await admin.auth.admin.deleteUser(userIdA).catch(() => {});
      await admin.auth.admin.deleteUser(userIdB).catch(() => {});

      process.env.NEXT_PUBLIC_SUPABASE_URL =
        ORIGINAL_ENV.NEXT_PUBLIC_SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        ORIGINAL_ENV.SUPABASE_SERVICE_ROLE_KEY;
      process.env.PGSODIUM_KEY_ID = ORIGINAL_ENV.PGSODIUM_KEY_ID;
    });

    async function signedInClientFor(email: string) {
      const anon = createClient(TEST_URL!, ANON_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await anon.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.session) {
        throw new Error(`sign-in for ${email} failed: ${error?.message}`);
      }
      return createClient(TEST_URL!, ANON_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        },
      });
    }

    it("Case 1: round-trip — service-role decrypt recovers the original plaintext", async () => {
      const target = await store.createTarget(userIdA, {
        name: "round-trip",
        api_host: "https://flowise.example.com",
        chatflow_id: "cf-1",
        api_token: "plaintext-secret-A",
      });

      // Projection MUST omit the encrypted column and key id.
      expect(Object.keys(target)).not.toContain("api_token_encrypted");
      expect(Object.keys(target)).not.toContain("api_token_key_id");

      const recovered = await store.decryptTokenForOutboundCall(
        userIdA,
        target.id,
      );
      expect(recovered).toBe("plaintext-secret-A");
    });

    it("Case 2: anon-role projection never returns api_token_encrypted on the wire", async () => {
      const target = await store.createTarget(userIdA, {
        name: "wire-projection",
        api_host: "https://flowise.example.com",
        chatflow_id: "cf-2",
        api_token: "plaintext-secret-A",
      });

      // Drive the public package API as user A — this is what runtime callers
      // see, and the AC ("never on the wire") is about this surface.
      const fromPackage = await store.getTarget(userIdA, target.id);
      expect(fromPackage).not.toBeNull();
      expect(Object.keys(fromPackage!)).not.toContain("api_token_encrypted");
      expect(Object.keys(fromPackage!)).not.toContain("api_token_key_id");

      // Belt-and-suspenders: a raw anon-role select * as user A also must not
      // surface the encrypted column. RLS lets A see their own row, but the
      // grant on api_token_encrypted should be service-role-only.
      const asA = await signedInClientFor(emailA);
      const { data, error } = await asA
        .from("chatflow_targets")
        .select("*")
        .eq("id", target.id);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(Object.keys(data![0])).not.toContain("api_token_encrypted");
    });

    it("Case 3: cross-user RLS — B cannot read A's target row", async () => {
      const target = await store.createTarget(userIdA, {
        name: "rls-isolated",
        api_host: "https://flowise.example.com",
        chatflow_id: "cf-3",
        api_token: "plaintext-secret-A",
      });

      // Service-role API call with B's user id — package-level filter is
      // `eq("user_id", userIdB)` so the row is not returned.
      const viaPackage = await store.getTarget(userIdB, target.id);
      expect(viaPackage).toBeNull();

      // Raw anon-role read as user B — RLS on the table also returns nothing.
      const asB = await signedInClientFor(emailB);
      const { data, error } = await asB
        .from("chatflow_targets")
        .select("id")
        .eq("id", target.id);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("Case 4: decryptTokenForOutboundCall rejects mismatched user_id with a clear error", async () => {
      const target = await store.createTarget(userIdA, {
        name: "user-check",
        api_host: "https://flowise.example.com",
        chatflow_id: "cf-4",
        api_token: "plaintext-secret-A",
      });

      // Same service-role client as the legitimate decrypt — the function-
      // level user_id filter is what protects against a caller that passes
      // the wrong user id (accidentally or maliciously).
      let captured: unknown = null;
      try {
        await store.decryptTokenForOutboundCall(userIdB, target.id);
      } catch (e) {
        captured = e;
      }

      expect(captured).toBeInstanceOf(Error);
      const err = captured as Error;
      expect(err.message.length).toBeGreaterThan(0);
      // Must not silently return empty plaintext.
      // Error message must not leak ciphertext or plaintext.
      expect(err.message).not.toContain("plaintext-secret-A");
    });

    it.skipIf(!DB_URL)(
      "Case 5: rotation — per-row key id keeps prior rows decryptable under the original key",
      async () => {
        const oldKeyId = KEY_ID!;

        // Row 1: written under the original key.
        const targetOld = await store.createTarget(userIdA, {
          name: "rot-old",
          api_host: "https://flowise.example.com",
          chatflow_id: "cf-5a",
          api_token: "plaintext-old-key",
        });

        // Mint a fresh pgsodium key directly via SQL (matches what the
        // seed script does — see scripts/seed-pgsodium-key.ts).
        const created = execSql(
          "select id from pgsodium.create_key(name => 'chatflow_targets_test_rotation_" +
            Date.now() +
            "');",
        );
        if (created.length === 0) {
          throw new Error("pgsodium.create_key returned no rows");
        }
        const newKeyId = created[0]!;
        expect(newKeyId).not.toBe(oldKeyId);

        // Row 2: written under the new key id.
        process.env.PGSODIUM_KEY_ID = newKeyId;
        try {
          const targetNew = await store.createTarget(userIdA, {
            name: "rot-new",
            api_host: "https://flowise.example.com",
            chatflow_id: "cf-5b",
            api_token: "plaintext-new-key",
          });

          // Both rows decrypt — each uses its own per-row key id, regardless
          // of where PGSODIUM_KEY_ID currently points.
          await expect(
            store.decryptTokenForOutboundCall(userIdA, targetNew.id),
          ).resolves.toBe("plaintext-new-key");
          await expect(
            store.decryptTokenForOutboundCall(userIdA, targetOld.id),
          ).resolves.toBe("plaintext-old-key");

          // Re-encrypt the old row under the new key by writing the same
          // plaintext via updateTarget. Decrypt continues to work, now under
          // the new key id stored on the row.
          await store.updateTarget(userIdA, targetOld.id, {
            api_token: "plaintext-old-key",
          });
          await expect(
            store.decryptTokenForOutboundCall(userIdA, targetOld.id),
          ).resolves.toBe("plaintext-old-key");
        } finally {
          process.env.PGSODIUM_KEY_ID = oldKeyId;
        }
      },
    );
  },
);
