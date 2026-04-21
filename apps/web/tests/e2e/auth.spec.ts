/**
 * Auth flow E2E tests — covers the complete authentication pipeline:
 * login → permission check → redirect → access grant.
 *
 * Required env vars:
 *   E2E_TEST_USER_EMAIL      - Auth0 test user email
 *   E2E_TEST_USER_PASSWORD   - Auth0 test user password
 *   E2E_TEST_USER_ID         - Auth0 sub (user_id) for DB permission seeding
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *
 * Tests skip gracefully when credentials are absent (local dev without secrets).
 */

import { test, expect } from "./fixtures/auth.fixture";
import {
  deletePermission,
  getPermission,
  seedPermission,
} from "./helpers/db";

const TEST_APP = "command-center";
const TEST_APP_ROUTE = "/apps/command-center";
const SECOND_APP = "standup";
const SECOND_APP_ROUTE = "/apps/standup";

function userId(): string {
  const id = process.env.E2E_TEST_USER_ID;
  if (!id) throw new Error("E2E_TEST_USER_ID must be set");
  return id;
}

function credentialsPresent(): boolean {
  return !!(
    process.env.E2E_TEST_USER_EMAIL &&
    process.env.E2E_TEST_USER_PASSWORD &&
    process.env.E2E_TEST_USER_ID
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Successful login redirects to the requested app
// ─────────────────────────────────────────────────────────────────────────────
test("successful login redirects to requested app", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await seedPermission(userId(), TEST_APP, "view");

  try {
    // Navigate to the login page with a redirect to the app
    await page.goto(`/login?redirect=${TEST_APP}`);

    // Click "Continue with Auth0" — the login-form.tsx renders an <a> to /auth/login
    await page.locator("a", { hasText: /continue with auth0/i }).click();

    // Wait for redirect back after Auth0 login (storageState already has session)
    await page.waitForURL(/\/apps\/command-center/, { timeout: 30_000 });

    expect(page.url()).toMatch(/\/apps\/command-center/);
    expect(page.url()).not.toMatch(/\/login/);
    expect(page.url()).not.toMatch(/\/unauthorized/);
  } finally {
    await deletePermission(userId(), TEST_APP);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Unauthorized user is redirected to /unauthorized
// ─────────────────────────────────────────────────────────────────────────────
test("unauthorized user redirects to /unauthorized", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  // Ensure the test user has NO permission on the app
  await deletePermission(userId(), TEST_APP);

  await page.goto(TEST_APP_ROUTE);

  await page.waitForURL(/\/unauthorized/, { timeout: 15_000 });

  expect(page.url()).toMatch(/\/unauthorized/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("app")).toBe(TEST_APP);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Self-enroll grants view permission on first login
// ─────────────────────────────────────────────────────────────────────────────
test("self-enroll grants view permission on first login", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  // Ensure no pre-existing permission
  await deletePermission(userId(), TEST_APP);

  try {
    await page.goto(TEST_APP_ROUTE);

    // Server redirects to /unauthorized because user has no permission
    await page.waitForURL(/\/unauthorized/, { timeout: 15_000 });

    // "Get access" button is rendered when self-enroll is allowed for the slug
    // (APP_SELF_ENROLL_SLUGS includes "command-center" via playwright.config.ts)
    const getAccessBtn = page.getByRole("button", { name: /get access/i });
    await expect(getAccessBtn).toBeVisible({ timeout: 10_000 });
    await getAccessBtn.click();

    // After self-enroll the server action redirects to the app
    await page.waitForURL(new RegExp(TEST_APP_ROUTE), { timeout: 20_000 });
    expect(page.url()).toMatch(new RegExp(TEST_APP_ROUTE));

    // Verify DB row was created
    const perm = await getPermission(userId(), TEST_APP);
    expect(perm).toBe("view");
  } finally {
    await deletePermission(userId(), TEST_APP);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Permission hierarchy — admin can access view-required pages
// ─────────────────────────────────────────────────────────────────────────────
test("permission hierarchy: admin can access view-required app", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  // Seed the user with admin — which satisfies the app's "view" minimum
  await seedPermission(userId(), TEST_APP, "admin");

  try {
    await page.goto(TEST_APP_ROUTE);

    // Should NOT be redirected to /unauthorized
    // Wait for navigation to settle
    await page.waitForLoadState("networkidle");

    expect(page.url()).not.toMatch(/\/unauthorized/);
    expect(page.url()).not.toMatch(/\/login/);
    expect(page.url()).toMatch(new RegExp(TEST_APP_ROUTE));
  } finally {
    await deletePermission(userId(), TEST_APP);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Cross-subdomain (cross-app) cookies persist session
// ─────────────────────────────────────────────────────────────────────────────
test("cross-app session cookie persists without re-login", async ({
  loggedInContext: context,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await seedPermission(userId(), TEST_APP, "view");
  await seedPermission(userId(), SECOND_APP, "view");

  try {
    const page = await context.newPage();

    // Visit first app
    await page.goto(TEST_APP_ROUTE);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(new RegExp(TEST_APP_ROUTE));
    expect(page.url()).not.toMatch(/\/login/);

    // Navigate to second app in the same context — no re-login should occur
    await page.goto(SECOND_APP_ROUTE);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(new RegExp(SECOND_APP_ROUTE));
    expect(page.url()).not.toMatch(/\/login/);

    // Verify session cookie is still present
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "appSession" || c.name.startsWith("auth0"),
    );
    expect(sessionCookie).toBeDefined();

    await page.close();
  } finally {
    await deletePermission(userId(), TEST_APP);
    await deletePermission(userId(), SECOND_APP);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Expired / cleared session redirects to login
// ─────────────────────────────────────────────────────────────────────────────
test("expired session redirects to login", async ({ loggedInContext: context }) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await seedPermission(userId(), TEST_APP, "view");

  try {
    // Simulate expiry by clearing all cookies (drops the Auth0 appSession cookie)
    await context.clearCookies();

    const page = await context.newPage();

    await page.goto(TEST_APP_ROUTE);

    // Without a session, requireAccess() redirects to /login
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/login/);

    await page.close();
  } finally {
    await deletePermission(userId(), TEST_APP);
  }
});
