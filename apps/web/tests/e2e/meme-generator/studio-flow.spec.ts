/**
 * Meme Generator end-to-end studio flow.
 *
 * Covers: select an image template → save → reload → see in library →
 * fill quota (5 saves on free tier) → expect quota-exceeded dialog with
 * pro-tier upgrade copy → delete one → save succeeds.
 *
 * AI captions are gated for free-tier users (the AI button shows an
 * upgrade dialog rather than the caption modal). The spec asserts that
 * gating behavior so the "no real Anthropic API call" AC is satisfied
 * by construction. As defense in depth we also abort any request that
 * targets api.anthropic.com.
 *
 * The spec skips loudly when E2E credentials, seed prerequisites
 * (meme_templates rows and a free-tier subscription for the test user),
 * or storage backing aren't available. When missing prereqs are
 * detected at runtime we log a warning and skip the test rather than
 * fail — milestone 014 will land a richer test harness.
 */

import { createClient } from "@supabase/supabase-js";
import type { Page, Route } from "@playwright/test";
import { test, expect } from "../fixtures/auth.fixture";
import { deletePermission, seedPermission } from "../helpers/db";

const APP_SLUG = "meme-generator";
const APP_ROUTE = "/apps/meme-generator";
const LIBRARY_ROUTE = "/apps/meme-generator/library";
const FREE_TIER_QUOTA = 5;

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

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function seedFreeTier(uid: string): Promise<void> {
  const client = adminClient();
  await client.from("subscriptions").upsert(
    {
      user_id: uid,
      tier: "free",
      status: "active",
    },
    { onConflict: "user_id" },
  );
}

async function templatesAvailable(): Promise<boolean> {
  try {
    const { count, error } = await adminClient()
      .from("meme_templates")
      .select("id", { count: "exact", head: true })
      .eq("isActive", true);
    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

async function clearMemes(uid: string): Promise<void> {
  const client = adminClient();
  const { data: rows } = await client
    .from("meme_creations")
    .select("storagePath")
    .eq("user_id", uid);
  await client.from("meme_creations").delete().eq("user_id", uid);
  const paths = (rows ?? [])
    .map((r) => (r as { storagePath?: string }).storagePath)
    .filter((p): p is string => typeof p === "string" && p.length > 0);
  if (paths.length > 0) {
    await client.storage.from("memes").remove(paths);
  }
}

async function blockAnthropic(page: Page): Promise<void> {
  await page.route("**/api.anthropic.com/**", (route: Route) => route.abort());
}

async function fillAndSaveOne(page: Page, title: string): Promise<void> {
  const titleInput = page.getByLabel(/title/i);
  await titleInput.fill(title);
  await page.getByTestId("action-save").click();
  // Wait for the save to settle: either error visible (test fails below) or
  // the title input clears or we navigate away. Easiest: poll meme count
  // indicator via library page reload. Here we just wait for the request
  // to complete by waiting for the save button to re-enable or quota dialog.
  await page.waitForLoadState("networkidle");
}

test.beforeAll(async () => {
  if (!credentialsPresent()) return;
  await seedPermission(userId(), APP_SLUG, "view");
});

test.afterAll(async () => {
  if (!credentialsPresent()) return;
  await deletePermission(userId(), APP_SLUG);
});

test.beforeEach(async () => {
  if (!credentialsPresent()) return;
  await clearMemes(userId());
  await seedFreeTier(userId());
});

test.afterEach(async () => {
  if (!credentialsPresent()) return;
  await clearMemes(userId());
});

test("free-tier studio flow: save → reload → library → quota → delete → save", async ({
  loggedInPage: page,
}) => {
  test.skip(!credentialsPresent(), "E2E credentials not set");

  if (!(await templatesAvailable())) {
    // eslint-disable-next-line no-console
    console.warn(
      "[meme-generator e2e] no active meme_templates rows — skipping. " +
        "Run scripts/seed-meme-templates.ts to populate.",
    );
    test.skip(true, "meme_templates not seeded");
  }

  await blockAnthropic(page);

  await page.goto(APP_ROUTE);

  await expect(page.getByTestId("template-gallery")).toBeVisible();

  // Pick the first template card.
  const firstCard = page.locator('[data-testid^="template-card-"]').first();
  await firstCard.click();

  // AI caption is gated for free tier — clicking the button should open the
  // upgrade prompt dialog, NOT the caption-generation modal. This is also
  // why no Anthropic call ever leaves the box for free-tier users.
  await page.getByTestId("ai-caption-button").click();
  await expect(page.getByText(/Pro Plan Required/i)).toBeVisible();
  // Close the upgrade dialog (Escape works for Radix dialogs).
  await page.keyboard.press("Escape");

  // Save 5 memes (free-tier quota).
  for (let i = 1; i <= FREE_TIER_QUOTA; i++) {
    await fillAndSaveOne(page, `E2E meme #${i}`);
    await expect(page.getByTestId("save-error")).toHaveCount(0);
  }

  // 6th save should hit the quota dialog with free→pro copy.
  const titleInput = page.getByLabel(/title/i);
  await titleInput.fill("E2E meme #6 (over quota)");
  await page.getByTestId("action-save").click();
  const quotaTitle = page.getByTestId("quota-error-title");
  await expect(quotaTitle).toBeVisible({ timeout: 10_000 });
  await expect(quotaTitle).toHaveText(/Save quota reached/i);
  const quotaDesc = page.getByTestId("quota-error-description");
  await expect(quotaDesc).toHaveText(/Upgrade to Pro/i);

  // RLS sanity: reload + visit library and confirm 5 saved memes are there.
  await page.goto(LIBRARY_ROUTE);
  await expect(page.getByTestId("library-grid")).toBeVisible();
  const cards = page.locator('[data-testid^="library-card-"]');
  await expect(cards).toHaveCount(FREE_TIER_QUOTA);

  // Delete one meme via the confirm dialog.
  const firstCardId = await cards
    .first()
    .getAttribute("data-testid")
    .then((v) => (v ?? "").replace(/^library-card-/, ""));
  expect(firstCardId).not.toBe("");
  await page.getByTestId(`library-delete-${firstCardId}`).click();
  await page.getByTestId(`library-delete-confirm-${firstCardId}`).click();
  await expect(cards).toHaveCount(FREE_TIER_QUOTA - 1);

  // Back to editor — the next save should now succeed.
  await page.goto(APP_ROUTE);
  await page
    .locator('[data-testid^="template-card-"]')
    .first()
    .click();
  await fillAndSaveOne(page, "E2E meme post-delete");
  await expect(page.getByTestId("save-error")).toHaveCount(0);

  // Final library check: count is back at quota (5).
  await page.goto(LIBRARY_ROUTE);
  await expect(
    page.locator('[data-testid^="library-card-"]'),
  ).toHaveCount(FREE_TIER_QUOTA);
});
