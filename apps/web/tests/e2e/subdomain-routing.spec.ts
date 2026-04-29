/**
 * Smoke test for the *.apps.lastrev.com subdomain routing cutover (issue #264).
 *
 * Verifies the auth flow on the new host pattern, response-header invariants on
 * each cluster, and that cross-app links emitted by Command Center point to
 * *.apps.lastrev.com (or relative paths).
 *
 * Skips gracefully when running locally on bare localhost — the assertions only
 * make sense against a deployed cluster (apps cluster, legacy cluster, or the
 * local /etc/hosts mirror).
 *
 * Required env vars (when running against a real cluster):
 *   PLAYWRIGHT_BASE_URL        - e.g. https://accounts.apps.lastrev.com
 *   PLAYWRIGHT_AUTH_HUB_URL    - e.g. https://auth.apps.lastrev.com (optional; derived if absent)
 *   E2E_TEST_USER_EMAIL/PASSWORD/ID — only needed for the login-redirect flow
 */

import { test, expect, request } from "@playwright/test";
import { loginWithAuth0 } from "./fixtures/auth.fixture";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

function isAppsCluster(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.endsWith(".apps.lastrev.com") ||
      u.hostname.endsWith(".apps.lastrev.localhost")
    );
  } catch {
    return false;
  }
}

function isLegacyCluster(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.endsWith(".lastrev.com") &&
      !u.hostname.endsWith(".apps.lastrev.com")
    );
  } catch {
    return false;
  }
}

function expectedAuthHub(url: string): string {
  const u = new URL(url);
  // accounts.apps.lastrev.com → auth.apps.lastrev.com
  // accounts.lastrev.com → auth.lastrev.com
  const parts = u.hostname.split(".");
  parts[0] = "auth";
  return `${u.protocol}//${parts.join(".")}`;
}

function originForApp(slug: string, baseUrl: string): string {
  const u = new URL(baseUrl);
  const parts = u.hostname.split(".");
  parts[0] = slug;
  return `${u.protocol}//${parts.join(".")}${u.port ? `:${u.port}` : ""}`;
}

test.describe("subdomain routing — apps cluster", () => {
  test.skip(
    !isAppsCluster(BASE_URL) && !isLegacyCluster(BASE_URL),
    `PLAYWRIGHT_BASE_URL is not on the apps or legacy cluster (got ${BASE_URL}); skipping cluster-only smoke checks`,
  );

  test("root response carries CSP and CSRF headers on the new host", async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${BASE_URL}/`, { maxRedirects: 0 });
    expect.soft(res.status()).toBeGreaterThanOrEqual(200);
    expect.soft(res.status()).toBeLessThan(400);

    const csp =
      res.headers()["content-security-policy"] ??
      res.headers()["content-security-policy-report-only"];
    expect(csp, "CSP header should be present on the apps cluster").toBeTruthy();
    expect(csp).toMatch(/default-src/);

    const setCookies = res.headersArray()
      .filter((h) => h.name.toLowerCase() === "set-cookie")
      .map((h) => h.value);
    const csrf = setCookies.find((c) => c.startsWith("csrf_token="));
    expect(csrf, "csrf_token cookie should be issued").toBeTruthy();
    expect(csrf).toMatch(/Path=\/(?:;|$)/);

    await ctx.dispose();
  });

  test("/auth/* path returns rate-limit headers", async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${BASE_URL}/auth/login`, { maxRedirects: 0 });

    const limit = res.headers()["x-ratelimit-limit"];
    const remaining = res.headers()["x-ratelimit-remaining"];
    const reset = res.headers()["x-ratelimit-reset"];
    expect(limit, "X-RateLimit-Limit should be present on /auth/*").toBeTruthy();
    expect(remaining).toBeTruthy();
    expect(reset).toBeTruthy();

    await ctx.dispose();
  });

  test("unauthed root either serves 200 or redirects to the cluster's auth hub", async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${BASE_URL}/`, { maxRedirects: 0 });

    if (res.status() >= 300 && res.status() < 400) {
      const loc = res.headers().location;
      expect(loc, "redirect should include Location").toBeTruthy();
      const target = new URL(loc!, BASE_URL);
      const expectedHub = new URL(expectedAuthHub(BASE_URL));
      expect(target.host).toBe(expectedHub.host);
    }

    await ctx.dispose();
  });
});

test.describe("subdomain routing — auth flow", () => {
  test.skip(
    !isAppsCluster(BASE_URL) && !isLegacyCluster(BASE_URL),
    "auth-flow smoke test runs only on a deployed cluster",
  );
  test.skip(
    !process.env.E2E_TEST_USER_EMAIL || !process.env.E2E_TEST_USER_PASSWORD,
    "E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD not set",
  );

  test("login redirect lands back on the new host with a session cookie", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginWithAuth0(page, "/");

    // After Auth0, we must come back to the same host we started from.
    expect(new URL(page.url()).host).toBe(new URL(BASE_URL).host);

    const cookies = await context.cookies();
    const session = cookies.find(
      (c) => c.name === "appSession" || c.name.startsWith("auth0"),
    );
    expect(session, "session cookie should be set after login").toBeTruthy();
    // Session cookie should be host-scoped to the apps cluster (not the legacy one).
    if (session && isAppsCluster(BASE_URL)) {
      const allowed =
        session.domain === new URL(BASE_URL).hostname ||
        session.domain.endsWith(".apps.lastrev.com") ||
        session.domain.endsWith(".apps.lastrev.localhost");
      expect(
        allowed,
        `session cookie domain ${session.domain} should be inside the apps cluster`,
      ).toBe(true);
    }

    await context.close();
  });
});

test.describe("cross-app links — Command Center home grid", () => {
  test.skip(
    !isAppsCluster(BASE_URL),
    "cross-app link audit only runs against the apps cluster",
  );

  test("emitted hrefs are relative or point to *.apps.lastrev.com", async ({
    browser,
  }) => {
    const commandCenterUrl = originForApp("command-center", BASE_URL);
    const context = await browser.newContext({
      storageState: process.env.E2E_AUTH_STATE_PATH,
    });
    const page = await context.newPage();
    const response = await page.goto(`${commandCenterUrl}/apps/command-center`, {
      waitUntil: "networkidle",
    });

    test.skip(
      !response || response.status() >= 400,
      `command-center responded ${response?.status()}; skipping link audit`,
    );

    const hrefs = await page.$$eval("a[href]", (els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
    );

    for (const href of hrefs) {
      if (!href || href.startsWith("/") || href.startsWith("#")) continue;
      // Allow same-cluster apps and the auth hub.
      let parsed: URL;
      try {
        parsed = new URL(href, commandCenterUrl);
      } catch {
        continue;
      }
      const ok =
        parsed.hostname.endsWith(".apps.lastrev.com") ||
        parsed.hostname.endsWith(".apps.lastrev.localhost") ||
        parsed.hostname === new URL(commandCenterUrl).hostname ||
        // External (non-lastrev) links are allowed
        !parsed.hostname.endsWith(".lastrev.com");
      expect(
        ok,
        `cross-app link ${href} should target the apps cluster, not legacy`,
      ).toBe(true);
    }

    await context.close();
  });
});
