/**
 * Cringe Rizzler access, generate & glossary E2E tests.
 *
 * Covers Group A (cases 1–6) from
 * docs/superpowers/plans/2026-04-30-cringe-rizzler-e2e-testing.md.
 *
 * Single spec file: the suite is small and shares one beforeAll permission
 * seed — splitting would add ceremony without value. Memes tab and the AI
 * live path are explicitly out of scope (third-party network + canvas /
 * non-deterministic).
 */

import { test, expect } from "../fixtures/auth.fixture";
import { deletePermission, seedPermission } from "../helpers/db";

const APP_SLUG = "cringe-rizzler";
const APP_ROUTE = "/apps/cringe-rizzler";

// Verbatim copy of FALLBACK_PHRASES from
// app/apps/cringe-rizzler/lib/actions.ts. Inlined because actions.ts is a
// "use server" module and importing it would pull server-only code into
// the Playwright runner.
const FALLBACK_PHRASES = [
  "This brisket is giving sigma rizz no cap fr fr.",
  "Bestie, your aura is totally bussin today, no cap!",
  "I understood the assignment at the grocery store — the sale items were goated.",
  "Let him cook, son. Dad's fanum tax on your fries is W behavior.",
  "That sunset is mid but my drip is bussin periodt.",
  "My PowerPoint presentation slayed so hard it caught them in 4k.",
  "We don't simp for overpriced avocado toast — that's L behavior, bet.",
  "I was the main character at the neighborhood BBQ, no cap fr fr.",
];

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

  await page.waitForURL(/\/login|auth0\.com\//, { timeout: 30_000 });

  expect(page.url()).toMatch(/\/login|auth0\.com\//);
  expect(page.url()).not.toMatch(new RegExp(APP_ROUTE + "$"));
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 2: Auth user without cringe-rizzler permission → /unauthorized
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
// Case 3: Auth user with view permission → page renders
// ─────────────────────────────────────────────────────────────────────────────
test("auth user with view permission renders the app page", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await seedPermission(userId(), APP_SLUG, "view");

  await page.goto(APP_ROUTE);

  await expect(
    page.getByRole("heading", { name: /Cringe Rizzler/, level: 1 }),
  ).toBeVisible();

  await expect(page.getByTestId("cringe-tab-phrases")).toBeVisible();
  await expect(page.getByTestId("cringe-tab-memes")).toBeVisible();
  await expect(page.getByTestId("cringe-tab-glossary")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 4: Phrase generation populates result with a fallback phrase
// ─────────────────────────────────────────────────────────────────────────────
test("phrase generation populates result with a fallback phrase", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await seedPermission(userId(), APP_SLUG, "view");

  await page.goto(APP_ROUTE);

  await expect(
    page.getByText(/Hit the button to generate your first cringe phrase/i),
  ).toBeVisible();

  await page.getByTestId("phrase-generate-button").click();

  const result = page.getByTestId("phrase-result");
  await expect
    .poll(async () => {
      const text = await result.innerText();
      return FALLBACK_PHRASES.some((p) => text.includes(p));
    }, { timeout: 15_000 })
    .toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 5: Save adds to saved list; reload clears it (no persistence)
// ─────────────────────────────────────────────────────────────────────────────
test("save adds to saved list and reload clears it", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await seedPermission(userId(), APP_SLUG, "view");

  await page.goto(APP_ROUTE);

  await page.getByTestId("phrase-generate-button").click();

  const result = page.getByTestId("phrase-result");
  await expect
    .poll(async () => {
      const text = await result.innerText();
      return FALLBACK_PHRASES.some((p) => text.includes(p));
    }, { timeout: 15_000 })
    .toBe(true);

  await page.getByTestId("phrase-save-button").click();

  const savedList = page.getByTestId("phrase-saved-list");
  await expect(savedList).toBeVisible();
  await expect(page.getByTestId("phrase-saved-item").first()).toBeVisible();

  await page.reload();

  await expect(page.getByTestId("phrase-saved-list")).toHaveCount(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Case 6: Glossary search/category filter updates count
// ─────────────────────────────────────────────────────────────────────────────
test("glossary search and category filter update the count", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  await seedPermission(userId(), APP_SLUG, "view");

  await page.goto(APP_ROUTE);

  await page.getByTestId("cringe-tab-glossary").click();

  const count = page.getByTestId("glossary-count");
  await expect(count).toBeVisible();
  const baseline = (await count.innerText()).trim();
  const baselineN = parseInt(baseline.match(/^(\d+)/)?.[1] ?? "0", 10);
  expect(baselineN).toBeGreaterThan(0);

  // Search narrows the list
  const search = page.getByTestId("glossary-search-input");
  await search.fill("rizz");
  await expect
    .poll(async () => {
      const text = (await count.innerText()).trim();
      const n = parseInt(text.match(/^(\d+)/)?.[1] ?? "0", 10);
      return n > 0 && n < baselineN;
    }, { timeout: 5_000 })
    .toBe(true);
  await expect(page.getByTestId("glossary-term-card").first()).toBeVisible();

  // Clearing search restores baseline
  await search.fill("");
  await expect
    .poll(async () => (await count.innerText()).trim(), { timeout: 5_000 })
    .toBe(baseline);

  // Category filter changes the count
  const select = page.getByTestId("glossary-category-select");
  await select.selectOption("personality");
  await expect
    .poll(async () => {
      const text = (await count.innerText()).trim();
      const n = parseInt(text.match(/^(\d+)/)?.[1] ?? "0", 10);
      return n > 0 && n < baselineN;
    }, { timeout: 5_000 })
    .toBe(true);
});
