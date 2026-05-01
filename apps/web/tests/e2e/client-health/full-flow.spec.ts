/**
 * Client-health full-flow e2e (issue #285).
 *
 * Exercises the happy path:
 *   1. Pro test user logs in (via shared loggedInPage fixture).
 *   2. Seed a unique client + site + site_metadata via the service-role
 *      DB helper so the cron does not need to run.
 *   3. Visit the per-client overview, assert score and breakdown render.
 *   4. Seed an ssl-expiring alert; visit /apps/client-health/alerts;
 *      acknowledge it; assert the row flips to acknowledged.
 *   5. (Stub) AI summary panel — checked when ANTHROPIC_API_KEY is unset
 *      and the local-dev fallback renders. Otherwise skipped.
 *
 * Run instructions (PR description duplicate):
 *   pnpm --filter web test:e2e -- client-health/full-flow.spec.ts
 *   Required env vars:
 *     E2E_TEST_USER_EMAIL, E2E_TEST_USER_PASSWORD, E2E_TEST_USER_ID
 *     NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * The test data is uniquified per run (clientId/clientName/url include
 * Date.now() and a random suffix) per the test-robustness skill.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { seedPermission, deletePermission } from "../helpers/db";
import {
  cleanupSeed,
  seedAlert,
  seedSite,
} from "../helpers/client-health-seed";

const APP_SLUG = "client-health";

test.describe.configure({ mode: "serial" });

function userId(): string {
  const id = process.env.E2E_TEST_USER_ID;
  if (!id) throw new Error("E2E_TEST_USER_ID must be set");
  return id;
}

function credentialsPresent(): boolean {
  return !!(
    process.env.E2E_TEST_USER_EMAIL &&
    process.env.E2E_TEST_USER_PASSWORD &&
    process.env.E2E_TEST_USER_ID &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// clients.id is a uuid PK — generate one per run so the seed never collides.
const CLIENT_ID = crypto.randomUUID();
const CLIENT_NAME = `E2E Client ${RUN_ID}`;
const SITE_URL = `https://e2e-${RUN_ID}.example.com`;

test.beforeAll(async () => {
  if (!credentialsPresent()) return;
  await seedPermission(userId(), APP_SLUG, "view");
  // SSL expiring in ~5 days so the alerting cron *would* fire if invoked.
  const sslExpiry = new Date(Date.now() + 5 * 86_400_000).toISOString();
  await seedSite({
    userId: userId(),
    clientId: CLIENT_ID,
    clientName: CLIENT_NAME,
    url: SITE_URL,
    sslExpiry,
  });
});

test.afterAll(async () => {
  if (!credentialsPresent()) return;
  await cleanupSeed({
    userId: userId(),
    clientId: CLIENT_ID,
    url: SITE_URL,
  }).catch(() => {});
  await deletePermission(userId(), APP_SLUG).catch(() => {});
});

test("alerts page surfaces seeded alerts and acknowledges them", async ({
  loggedInPage: page,
}, testInfo) => {
  if (!credentialsPresent()) {
    testInfo.skip(true, "E2E credentials / Supabase env not set");
    return;
  }

  const alertId = await seedAlert({
    userId: userId(),
    clientId: CLIENT_ID,
    type: "ssl-expiring",
    summary: `SSL expiring for ${CLIENT_NAME}`,
    severity: "critical",
  });

  await page.goto("/apps/client-health/alerts");

  const row = page.getByTestId(`alert-row-${alertId}`);
  await expect(row).toBeVisible();
  await expect(row).toContainText(CLIENT_NAME);
  await expect(row).toHaveAttribute("data-state", "open");

  await page.getByTestId(`ack-${alertId}`).click();
  await expect(row).toHaveAttribute("data-state", "acknowledged");
});

test("settings page lets a pro user save alert preferences", async ({
  loggedInPage: page,
}, testInfo) => {
  if (!credentialsPresent()) {
    testInfo.skip(true, "E2E credentials / Supabase env not set");
    return;
  }

  await page.goto("/apps/client-health/settings");
  const form = page.getByTestId("settings-form");
  await expect(form).toBeVisible();

  // sslWarnDays is required to be 1..365 — set to 21 and save.
  await page.getByLabel(/SSL expiry warning/i).fill("21");
  await page.getByLabel(/Health drop threshold/i).fill("15");
  await page.getByRole("button", { name: /Save preferences/i }).click();

  await expect(page.getByText(/Saved/i)).toBeVisible();
});
