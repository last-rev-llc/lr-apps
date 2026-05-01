/**
 * Alpha Wins access & gating E2E tests.
 *
 * Covers Group A cases 1–3 from
 * docs/superpowers/plans/2026-04-30-alpha-wins-e2e-testing.md.
 *
 * Lives in its own file (separate from gallery.spec.ts) because case 2
 * deletes the permission row and case 3 re-seeds it — splitting avoids
 * leaking permission state between concerns.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { deletePermission, seedPermission } from "../helpers/db";
import winsData from "../../../app/apps/alpha-wins/data/wins.json" with { type: "json" };

const APP_SLUG = "alpha-wins";
const APP_ROUTE = "/apps/alpha-wins";

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

test.beforeAll(async () => {
  if (!credentialsPresent()) return;
  await seedPermission(userId(), APP_SLUG, "view");
});

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
// Case 2: Auth user without alpha-wins permission → /unauthorized
// ─────────────────────────────────────────────────────────────────────────────
test("auth user without permission redirects to /unauthorized", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  // Drop any pre-seeded permission for this case
  await deletePermission(userId(), APP_SLUG);

  await page.goto(APP_ROUTE);

  await page.waitForURL(/\/unauthorized/, { timeout: 15_000 });

  expect(page.url()).toMatch(/\/unauthorized/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("app")).toBe(APP_SLUG);
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 3: Auth user with view permission → page renders
// ─────────────────────────────────────────────────────────────────────────────
test("auth user with view permission renders the gallery page", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  // Re-seed (case 2 deleted it) so this test is independent of order
  await seedPermission(userId(), APP_SLUG, "view");

  await page.goto(APP_ROUTE);

  await expect(
    page.getByRole("heading", { name: "Alpha Wins", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Recent wins & accomplishments")).toBeVisible();

  const winsLen = winsData.length;
  const badgeText = `${winsLen} win${winsLen === 1 ? "" : "s"}`;
  await expect(page.getByText(badgeText, { exact: true })).toBeVisible();
});
