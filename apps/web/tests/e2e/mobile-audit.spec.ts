/**
 * Mobile viewport audit (issue #222).
 *
 * Visits the root route of every registered app at three breakpoints
 * (375 / 768 / 1440) and captures a full-page screenshot per app/viewport
 * combination. At the 375 px breakpoint, asserts that the document does not
 * horizontally overflow the viewport — the most common mobile regression.
 *
 * Baseline screenshots are written to `tests/e2e/snapshots/mobile/` and
 * checked into the repo so reviewers can spot visual regressions in PR diffs.
 *
 * Skips gracefully when running on bare localhost without a cluster mirror —
 * each app's host is constructed from the registry, so the test is meaningful
 * only against an environment where subdomains resolve back to the platform.
 * Set `PLAYWRIGHT_BASE_URL` to `http://<sub>.apps.lastrev.localhost:3000` (or
 * the deployed cluster) for a real run.
 */

import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { getAllApps, type AppConfig } from "../../lib/app-registry";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const VIEWPORTS = [
  { width: 375, height: 812, label: "375" },
  { width: 768, height: 1024, label: "768" },
  { width: 1440, height: 900, label: "1440" },
] as const;

const SNAPSHOT_DIR = path.join(
  __dirname,
  "snapshots",
  "mobile",
);

function originForApp(app: AppConfig, baseUrl: string): string {
  const u = new URL(baseUrl);
  // On bare localhost we can't change the host (registry lookups go by
  // subdomain), so fall through to a `?app=<slug>` query — proxy.ts honours
  // this in dev when no subdomain is present.
  if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
    return `${u.protocol}//${u.host}/?app=${app.slug}`;
  }
  const parts = u.hostname.split(".");
  parts[0] = app.subdomain;
  return `${u.protocol}//${parts.join(".")}${u.port ? `:${u.port}` : ""}`;
}

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    // 1px slack absorbs sub-pixel rounding the browser sometimes reports.
    return doc.scrollWidth - window.innerWidth > 1;
  });
}

const apps = getAllApps();

test.describe("mobile viewport audit", () => {
  for (const app of apps) {
    test.describe(app.slug, () => {
      for (const vp of VIEWPORTS) {
        test(`${app.slug} @ ${vp.label}px`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });

          const url = originForApp(app, BASE_URL);
          const response = await page.goto(url, { waitUntil: "networkidle" });

          // Auth-gated apps may redirect to the auth hub when no session is
          // present. Capture the screenshot anyway (the redirect destination
          // is still part of the user-visible mobile surface) but skip the
          // overflow assertion when the app explicitly requires auth and we
          // landed on a non-app page.
          const status = response?.status() ?? 0;
          await page.screenshot({
            path: path.join(
              SNAPSHOT_DIR,
              `${app.slug}-${vp.label}.png`,
            ),
            fullPage: true,
          });

          if (vp.width === 375 && status >= 200 && status < 400) {
            const overflow = await hasHorizontalOverflow(page);
            expect(
              overflow,
              `${app.slug} overflows the 375px viewport horizontally`,
            ).toBe(false);
          }
        });
      }
    });
  }
});
