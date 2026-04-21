import { test as base, type BrowserContext, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

export const AUTH_STATE_PATH = path.join(__dirname, "../.auth/user.json");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

function hasCredentials(): boolean {
  return !!(
    process.env.E2E_TEST_USER_EMAIL &&
    process.env.E2E_TEST_USER_PASSWORD
  );
}

function hasAuthState(): boolean {
  return fs.existsSync(AUTH_STATE_PATH);
}

/** Performs Auth0 Universal Login in a given page and returns after redirect. */
export async function loginWithAuth0(
  page: Page,
  returnTo = "/my-apps",
): Promise<void> {
  const email = process.env.E2E_TEST_USER_EMAIL!;
  const password = process.env.E2E_TEST_USER_PASSWORD!;

  await page.goto(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);

  // Wait for redirect to Auth0 Universal Login
  await page.waitForURL(/\.auth0\.com\//, { timeout: 30_000 });

  await page.locator('input[name="username"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect back to our app
  await page.waitForURL(new RegExp(escapeRegex(BASE_URL)), { timeout: 30_000 });
}

type AuthFixtures = {
  /** Pre-authenticated page loaded from saved storageState. */
  loggedInPage: Page;
  /** Fresh browser context with no session cookies. */
  unauthPage: Page;
  /** The authenticated browser context (for cookie manipulation). */
  loggedInContext: BrowserContext;
};

export const test = base.extend<AuthFixtures>({
  loggedInPage: async ({ browser }, use, testInfo) => {
    if (!hasCredentials()) {
      testInfo.skip(true, "E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD not set");
    }

    const storageState = hasAuthState() ? AUTH_STATE_PATH : undefined;
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // If no saved state, perform a fresh login
    if (!storageState) {
      await loginWithAuth0(page, "/my-apps");
    }

    await use(page);
    await context.close();
  },

  loggedInContext: async ({ browser }, use, testInfo) => {
    if (!hasCredentials()) {
      testInfo.skip(true, "E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD not set");
    }

    const storageState = hasAuthState() ? AUTH_STATE_PATH : undefined;
    const context = await browser.newContext({ storageState });

    if (!storageState) {
      const page = await context.newPage();
      await loginWithAuth0(page, "/my-apps");
      await page.close();
    }

    await use(context);
    await context.close();
  },

  unauthPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
