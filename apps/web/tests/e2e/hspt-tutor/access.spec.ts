/**
 * HSPT Tutor access & gating E2E tests.
 *
 * Covers Group A cases 1–4 from
 * docs/superpowers/plans/2026-04-30-hspt-tutor-e2e-testing.md.
 *
 * Quiz-flow, adaptive-selection, and localStorage round-trip coverage stays
 * at the Vitest unit-test layer (components/__tests__/tutor-app.test.tsx,
 * lib/__tests__/adaptive.test.ts). E2E owns only the auth → routing → render
 * boundary that unit tests can't exercise.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { deletePermission, seedPermission } from "../helpers/db";

const APP_SLUG = "hspt-tutor";
const APP_ROUTE = "/apps/hspt-tutor";

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

test.afterAll(async () => {
  if (!credentialsPresent()) return;
  await deletePermission(userId(), APP_SLUG);
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 1: Unauth user is redirected to login
// ─────────────────────────────────────────────────────────────────────────────
test("unauth user is redirected to login", async ({ unauthPage: page }) => {
  await page.goto(APP_ROUTE);

  // requireAccess() redirects unauthenticated users to /login; following the
  // in-app login flow can also land on Auth0's universal login domain.
  await page.waitForURL(/\/login|auth0\.com\//, { timeout: 30_000 });

  expect(page.url()).toMatch(/\/login|auth0\.com\//);
  expect(page.url()).not.toMatch(new RegExp(APP_ROUTE + "$"));
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 2: Auth user without hspt-tutor permission → /unauthorized
// ─────────────────────────────────────────────────────────────────────────────
test("auth user without permission redirects to /unauthorized", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await deletePermission(userId(), APP_SLUG);

  await page.goto(APP_ROUTE);

  await page.waitForURL(/\/unauthorized/, { timeout: 15_000 });

  expect(page.url()).toMatch(/\/unauthorized/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("app")).toBe(APP_SLUG);
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 3: Auth user with view permission → page renders header + tabs
// ─────────────────────────────────────────────────────────────────────────────
test("auth user with view permission renders header and tabs", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await seedPermission(userId(), APP_SLUG, "view");

  try {
    await page.goto(APP_ROUTE);

    // Layout header — emoji is rendered in a separate <span>, so target the <h1> text only.
    await expect(
      page.getByRole("heading", { name: "HSPT Tutor", level: 1 }),
    ).toBeVisible();

    // Tab list — TabsTrigger renders the literal labels with emoji prefixes.
    await expect(
      page.getByRole("tab", { name: /Dashboard/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Practice/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Progress/ }),
    ).toBeVisible();
  } finally {
    await deletePermission(userId(), APP_SLUG);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 4: Permission hierarchy — admin satisfies the registry-declared view minimum
// ─────────────────────────────────────────────────────────────────────────────
test("permission hierarchy: admin satisfies the view minimum", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  // Seed admin (higher than the registry's "view" minimum) — proves the layout
  // gate honors the hierarchy rather than a hard-coded "view" string match.
  await seedPermission(userId(), APP_SLUG, "admin");

  try {
    await page.goto(APP_ROUTE);
    await page.waitForLoadState("networkidle");

    expect(page.url()).not.toMatch(/\/unauthorized/);
    expect(page.url()).not.toMatch(/\/login/);
    expect(page.url()).toMatch(new RegExp(APP_ROUTE));

    await expect(
      page.getByRole("heading", { name: "HSPT Tutor", level: 1 }),
    ).toBeVisible();
  } finally {
    await deletePermission(userId(), APP_SLUG);
  }
});
