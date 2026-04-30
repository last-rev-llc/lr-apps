/**
 * Alpha Wins gallery interactions E2E tests.
 *
 * Covers Group A cases 4–8 from
 * docs/superpowers/plans/2026-04-30-alpha-wins-e2e-testing.md.
 *
 * Lives in its own file (separate from access.spec.ts) because this suite
 * keeps a stable seeded permission throughout — splitting avoids leaking
 * permission state between concerns.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { deletePermission, seedPermission } from "../helpers/db";

const APP_SLUG = "alpha-wins";
const APP_ROUTE = "/apps/alpha-wins";

// Real win names from apps/web/app/apps/alpha-wins/data/wins.json — referenced
// directly so the spec exercises the production payload (per plan §2).
const WIN_WEATHER = "Morning Weather Briefing";
const WIN_CHANNEL = "Wins Channel — Share What You Build";

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
// Case 4: Search filters the grid and badge flips to singular
// ─────────────────────────────────────────────────────────────────────────────
test("search narrows the grid and updates the count badge to singular", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await page.goto(APP_ROUTE);

  await page.getByPlaceholder("Search wins…").fill("weather");

  await expect(page.getByText(WIN_WEATHER)).toBeVisible();
  await expect(page.getByText(WIN_CHANNEL)).toBeHidden();
  await expect(page.getByText("1 win", { exact: true })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 5: Search empty state
// ─────────────────────────────────────────────────────────────────────────────
test("search with no matches shows the empty state", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await page.goto(APP_ROUTE);

  await page.getByPlaceholder("Search wins…").fill("zzznomatch");

  await expect(page.getByText("No wins match that filter")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 6: Integration filter pill stays selected after click
// ─────────────────────────────────────────────────────────────────────────────
test("Slack integration pill becomes selected after click", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await page.goto(APP_ROUTE);

  // The integration filter row is keyed by the "Filter by integration"
  // aria-label on the wrapping div — scope to that to disambiguate from any
  // tag/badge text reading "Slack" inside cards.
  const integrationRow = page.locator('[aria-label="Filter by integration"]');
  const slackPill = integrationRow.getByRole("button", { name: "Slack" });

  await slackPill.click();

  // Selected pills get the accent style classes applied by wins-gallery.tsx.
  await expect(slackPill).toHaveClass(/bg-accent\/15/);

  // Today's dataset has both wins integrating with Slack — both stay visible.
  await expect(page.getByText(WIN_WEATHER)).toBeVisible();
  await expect(page.getByText(WIN_CHANNEL)).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 7: Category filter pill narrows to type === "Workflow"
// ─────────────────────────────────────────────────────────────────────────────
test("Workflow category pill filters to Workflow-type wins only", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await page.goto(APP_ROUTE);

  const categoryRow = page.locator('[aria-label="Filter by category"]');
  await categoryRow.getByRole("button", { name: "Workflow" }).click();

  // Only the Wins Channel (type: "Workflow") remains; the weather briefing
  // (type: "Automation") drops out.
  await expect(page.getByText(WIN_CHANNEL)).toBeVisible();
  await expect(page.getByText(WIN_WEATHER)).toBeHidden();
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 8: Click a card → modal opens; Escape closes it
// ─────────────────────────────────────────────────────────────────────────────
test("clicking a win card opens the detail modal and Escape closes it", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await page.goto(APP_ROUTE);

  await page.getByRole("button", { name: /Wins Channel/ }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(WIN_CHANNEL);
  await expect(dialog.getByText("Setup Prompt")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: /Copy Prompt/ }),
  ).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
});
