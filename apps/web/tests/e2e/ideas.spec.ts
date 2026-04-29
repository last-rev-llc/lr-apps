/**
 * Ideas app E2E — covers the create → edit → rate → snooze → archive flow,
 * RLS isolation between users, and the plan-rendering surface.
 *
 * The AI "Plan & score" interaction is mocked at the data layer: we seed an
 * idea with a pre-populated plan and assert the PlanSection renders the
 * Markdown. The UI button itself is wired in a later issue; this stays
 * close to the AC's intent (no real Anthropic call, the UI handles a
 * successful response and renders the markdown plan) without forging an
 * RSC server-action response.
 */

import { test, expect } from "./fixtures/auth.fixture";
import {
  deleteIdeasForUser,
  deletePermission,
  seedIdea,
  seedPermission,
} from "./helpers/db";

const TEST_APP = "ideas";
const TEST_APP_ROUTE = "/apps/ideas";
const FOREIGN_USER_ID = "00000000-0000-4000-8000-000000000777";

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

test.describe("ideas app", () => {
  test.beforeEach(async () => {
    if (!credentialsPresent()) return;
    await seedPermission(userId(), TEST_APP, "view");
    await deleteIdeasForUser(userId());
  });

  test.afterEach(async () => {
    if (!credentialsPresent()) return;
    await deleteIdeasForUser(userId());
    await deletePermission(userId(), TEST_APP);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 1: full flow — sign in to archive
  // ───────────────────────────────────────────────────────────────────────────
  test("sign-in → create → edit → rate → snooze → archive", async ({
    loggedInPage: page,
  }) => {
    test.skip(!credentialsPresent(), "E2E credentials not set");

    const ideaTitle = `E2E test idea ${Date.now()}`;

    await page.goto(TEST_APP_ROUTE);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(new RegExp(TEST_APP_ROUTE));

    // ── Create
    await page.getByRole("button", { name: /\+ new idea/i }).click();
    const createDialog = page.getByRole("dialog");
    await expect(createDialog).toBeVisible();
    await createDialog.locator("input[type='text']").first().fill(ideaTitle);
    await createDialog.locator("textarea").first().fill("E2E description body");
    await createDialog.getByRole("button", { name: /^create$/i }).click();
    await expect(page.getByText(ideaTitle)).toBeVisible({ timeout: 15_000 });

    // ── Edit (open row menu → Edit, set category, add tag)
    await page.getByRole("button", { name: /idea options/i }).first().click();
    await page.getByRole("button", { name: /edit/i }).click();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog).toBeVisible();
    await expect(editDialog.locator("input[type='text']").nth(0)).toHaveValue(
      ideaTitle,
    );
    await editDialog.locator("input[type='text']").nth(1).fill("Product");
    await editDialog.locator("input[type='text']").nth(2).fill("e2e");
    await editDialog.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(ideaTitle)).toBeVisible();

    // ── Rate (4th star)
    await page.getByRole("button", { name: /Rate 4 out of 5/i }).first().click();
    await expect(page.getByText(ideaTitle)).toBeVisible();

    // ── Snooze (1 Week)
    await page.getByRole("button", { name: /^snooze$/i }).first().click();
    await page.getByRole("button", { name: /^1 week$/i }).click();

    // After snoozing, the card disappears from the default Active filter
    await expect(page.getByText(ideaTitle)).toHaveCount(0);

    // Switch to Snoozed → should see the card
    await page
      .getByRole("button", { name: /^snoozed \(\d+\)/i })
      .click();
    await expect(page.getByText(ideaTitle)).toBeVisible();

    // ── Archive (open row menu → Archive)
    await page.getByRole("button", { name: /idea options/i }).first().click();
    await page.getByRole("button", { name: /archive/i }).click();

    // Archived ideas are excluded from the default queue. Switch back to
    // Active and confirm absence.
    await page.getByRole("button", { name: /^active \(\d+\)/i }).click();
    await expect(page.getByText(ideaTitle)).toHaveCount(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2: RLS — another user's idea must never appear in the list
  // ───────────────────────────────────────────────────────────────────────────
  test("RLS: another user's idea never appears in the list", async ({
    loggedInPage: page,
  }) => {
    test.skip(!credentialsPresent(), "E2E credentials not set");

    const foreignTitle = `Foreign owner idea ${Date.now()}`;
    let foreignId: string | null = null;
    try {
      foreignId = await seedIdea(FOREIGN_USER_ID, {
        title: foreignTitle,
        description: "Should never be visible to the test user",
        category: "Product",
      });

      await page.goto(TEST_APP_ROUTE);
      await page.waitForLoadState("networkidle");

      // Show=All so no client-side filter could explain absence.
      // Scope to the Show row because the Categories PillList also renders
      // an "All" pill with role="button" — strict mode would otherwise match
      // both. The show filter uses real <Button> elements, so .last() picks
      // the trailing one in DOM order.
      await page
        .getByRole("button", { name: /^all$/i })
        .last()
        .click();

      await expect(page.getByText(foreignTitle)).toHaveCount(0);
    } finally {
      if (foreignId) {
        // Service-role cleanup for the foreign user's row
        const { deleteIdea } = await import("./helpers/db");
        await deleteIdea(foreignId);
      }
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3: AI plan rendering — seeded plan is rendered as Markdown.
  //
  // The Plan & score server action is not yet wired into the UI button; this
  // assertion confirms the rendering surface (PlanSection) handles a plan
  // payload end-to-end (DB → page → ReactMarkdown). When the action is wired,
  // this can be extended to drive the click and intercept the action call.
  // ───────────────────────────────────────────────────────────────────────────
  test("renders a stored plan as Markdown without calling Anthropic", async ({
    loggedInPage: page,
  }) => {
    test.skip(!credentialsPresent(), "E2E credentials not set");

    const ideaTitle = `Plan render idea ${Date.now()}`;
    const planMarkdown = [
      `# Plan for ${ideaTitle}`,
      "",
      "1. **Define the goal** — write a one-sentence problem statement.",
      "2. **Sketch the user flow** — list every screen.",
      "3. **Ship a vertical slice** — exercise every layer end-to-end.",
    ].join("\n");

    await seedIdea(userId(), {
      title: ideaTitle,
      description: "AI plan rendering test",
      category: "Product",
      plan: planMarkdown,
      planModel: "claude-sonnet-4-6",
      planGeneratedAt: new Date().toISOString(),
      feasibility: 7,
      impact: 8,
      effort: "Medium",
    });

    await page.goto(TEST_APP_ROUTE);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(ideaTitle)).toBeVisible({ timeout: 15_000 });

    // Open the plan section
    await page.getByRole("button", { name: /show plan/i }).first().click();

    // Verify the markdown was parsed and rendered as headings/list items
    await expect(
      page.getByRole("heading", { name: new RegExp(`Plan for ${ideaTitle}`) }),
    ).toBeVisible();
    await expect(page.getByText(/Define the goal/i)).toBeVisible();
    await expect(page.getByText(/Sketch the user flow/i)).toBeVisible();
    await expect(page.getByText(/by claude-sonnet-4-6/i)).toBeVisible();
  });
});
