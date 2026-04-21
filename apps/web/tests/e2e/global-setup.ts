import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const AUTH_STATE_PATH = path.join(__dirname, ".auth/user.json");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * Performs Auth0 Universal Login through the browser and saves storageState so
 * individual tests can start pre-authenticated without repeating the login flow.
 * Skips gracefully when E2E credentials are not configured.
 */
export default async function globalSetup() {
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      "[e2e] E2E_TEST_USER_EMAIL or E2E_TEST_USER_PASSWORD not set — skipping auth pre-login. Tests that require a session will skip.",
    );
    return;
  }

  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/auth/login?returnTo=%2Fmy-apps`);

    // Auth0 Universal Login redirects to the Auth0 domain
    await page.waitForURL(/\.auth0\.com\//, { timeout: 30_000 });

    await page.locator('input[name="username"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect back to our app after successful Auth0 login
    await page.waitForURL(new RegExp(escapeRegex(BASE_URL)), { timeout: 30_000 });

    await context.storageState({ path: AUTH_STATE_PATH });
    console.log(`[e2e] Auth session saved to ${AUTH_STATE_PATH}`);
  } finally {
    await browser.close();
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
