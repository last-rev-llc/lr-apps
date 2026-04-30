// Template — `apps/web/tests/e2e/<slug>/crud.spec.ts`
//
// Group B from the plan: create (validation + happy path), edit, delete.
// Uses the entity helper at `apps/web/tests/e2e/helpers/<slug>.ts` for
// DB-side assertions, and the testid hooks added during bootstrap.
//
// Replace <slug>, <Slug>, <Entity>, and helper imports with the real ones.

import { test, expect } from "../fixtures/auth.fixture";
import { seedPermission } from "../helpers/db";
import {
  delete<Entities>ForUser,
  list<Entities>ForUser,
  seed<Entity>,
} from "../helpers/<slug>";

const APP_SLUG = "<slug>";
const APP_ROUTE = "/apps/<slug>";

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

test.describe("<Slug> — CRUD", () => {
  test.skip(
    !credentialsPresent(),
    "E2E_TEST_USER_* env vars not set — skipping",
  );

  test.beforeAll(async () => {
    await seedPermission(userId(), APP_SLUG, "edit");
  });

  test.afterEach(async () => {
    await delete<Entities>ForUser(userId());
  });

  test("create modal: validation error on empty required field", async ({
    loggedInPage,
  }) => {
    await loggedInPage.goto(APP_ROUTE);
    await loggedInPage.getByTestId("new-<entity>-button").click();
    await loggedInPage.getByTestId("<entity>-form-submit").click();
    await expect(loggedInPage.getByTestId("<entity>-form")).toContainText(
      /required/i,
    );
    expect(await list<Entities>ForUser(userId())).toHaveLength(0);
  });

  test("create with minimum payload persists row and renders card", async ({
    loggedInPage,
  }) => {
    const title = `e2e-${Date.now()}`;
    await loggedInPage.goto(APP_ROUTE);
    await loggedInPage.getByTestId("new-<entity>-button").click();
    await loggedInPage
      .getByTestId("<entity>-form-title-input")
      .fill(title);
    await loggedInPage.getByTestId("<entity>-form-submit").click();

    await expect(
      loggedInPage.getByTestId("<entity>-card").filter({ hasText: title }),
    ).toBeVisible();

    const rows = await list<Entities>ForUser(userId());
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe(title);
  });

  test("edit existing entity persists changes", async ({ loggedInPage }) => {
    const seeded = await seed<Entity>(userId(), { title: "before" });

    await loggedInPage.goto(APP_ROUTE);
    await loggedInPage
      .getByTestId("<entity>-card")
      .filter({ hasText: "before" })
      .getByTestId("row-menu-trigger")
      .click();
    await loggedInPage.getByTestId("edit-<entity>").click();
    await loggedInPage
      .getByTestId("<entity>-form-title-input")
      .fill("after");
    await loggedInPage.getByTestId("<entity>-form-submit").click();

    await expect(
      loggedInPage.getByTestId("<entity>-card").filter({ hasText: "after" }),
    ).toBeVisible();

    const rows = await list<Entities>ForUser(userId());
    expect(rows.find((r) => r.id === seeded.id)?.title).toBe("after");
  });

  test("delete with confirmation removes row", async ({ loggedInPage }) => {
    await seed<Entity>(userId(), { title: "to-delete" });

    await loggedInPage.goto(APP_ROUTE);
    await loggedInPage
      .getByTestId("<entity>-card")
      .filter({ hasText: "to-delete" })
      .getByTestId("row-menu-trigger")
      .click();
    await loggedInPage.getByTestId("delete-button").click();
    await loggedInPage.getByTestId("delete-confirm").click();

    await expect(
      loggedInPage.getByTestId("<entity>-card").filter({ hasText: "to-delete" }),
    ).toHaveCount(0);
    expect(await list<Entities>ForUser(userId())).toHaveLength(0);
  });
});
