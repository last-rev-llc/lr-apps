#!/usr/bin/env node
// Seeds the local/dev Supabase database with realistic test data:
//   - app_permissions (admin) for the E2E test user across every auth-required app
//   - a "pro" subscription with placeholder Stripe IDs
//
// Idempotent — uses upsert with the unique (user_id, app_slug) and (user_id)
// constraints, so re-running the script is safe.
//
// Required env:
//   E2E_TEST_USER_ID          uuid of the seed user
//   E2E_TEST_USER_EMAIL       email of the seed user (logged for clarity only)
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Usage: pnpm db:seed
import { createServiceRoleClient } from "../packages/db/src/service-role.ts";
import { getAllApps } from "../apps/web/lib/app-registry.ts";

interface SeedSummary {
  permissions: { upserted: number; apps: string[] };
  subscription: { user_id: string; tier: string; status: string };
}

export async function seed(): Promise<SeedSummary> {
  const userId = process.env.E2E_TEST_USER_ID;
  const userEmail = process.env.E2E_TEST_USER_EMAIL;

  if (!userId) {
    throw new Error(
      "E2E_TEST_USER_ID is required. Create a Supabase auth user first, then export E2E_TEST_USER_ID and E2E_TEST_USER_EMAIL.",
    );
  }
  if (!userEmail) {
    throw new Error("E2E_TEST_USER_EMAIL is required.");
  }

  const db = createServiceRoleClient();

  // 1) app_permissions — admin on every auth=true app
  const authApps = getAllApps().filter((a) => a.auth);
  const permissionRows = authApps.map((a) => ({
    user_id: userId,
    app_slug: a.slug,
    permission: "admin" as const,
  }));

  const { error: permErr } = await db
    .from("app_permissions")
    .upsert(permissionRows, { onConflict: "user_id,app_slug" });
  if (permErr) {
    throw new Error(`app_permissions upsert failed: ${permErr.message}`);
  }

  // 2) subscription — pro tier with placeholder Stripe IDs
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { error: subErr } = await db
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: "cus_test_seed",
        stripe_subscription_id: "sub_test_seed",
        tier: "pro" as const,
        status: "active" as const,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (subErr) {
    throw new Error(`subscriptions upsert failed: ${subErr.message}`);
  }

  return {
    permissions: {
      upserted: permissionRows.length,
      apps: authApps.map((a) => a.slug),
    },
    subscription: { user_id: userId, tier: "pro", status: "active" },
  };
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  seed()
    .then((summary) => {
      console.log("Seed complete.");
      console.log(
        `  permissions: ${summary.permissions.upserted} app(s) — ${summary.permissions.apps.join(", ")}`,
      );
      console.log(
        `  subscription: tier=${summary.subscription.tier} status=${summary.subscription.status}`,
      );
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Seed failed: ${message}`);
      process.exit(1);
    });
}
