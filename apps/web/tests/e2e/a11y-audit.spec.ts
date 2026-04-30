/**
 * Accessibility audit (issue #223).
 *
 * Runs axe-core against the root route of every registered app. Per-app
 * results land in `tests/e2e/reports/a11y/<slug>.json` so reviewers can
 * inspect the full violation list. The test fails on any violation tagged
 * `critical` (or, optionally, `serious` when STRICT_A11Y=1) so a regression
 * cannot land without being acknowledged.
 *
 * Like the mobile audit, this only produces meaningful results against an
 * environment where each app's subdomain resolves back to the platform.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllApps, type AppConfig } from "../../lib/app-registry";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const STRICT = process.env.STRICT_A11Y === "1";

const REPORT_DIR = path.join(__dirname, "reports", "a11y");

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function originForApp(app: AppConfig, baseUrl: string): string {
  const u = new URL(baseUrl);
  if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
    return `${u.protocol}//${u.host}/?app=${app.slug}`;
  }
  const parts = u.hostname.split(".");
  parts[0] = app.subdomain;
  return `${u.protocol}//${parts.join(".")}${u.port ? `:${u.port}` : ""}`;
}

const apps = getAllApps();

test.beforeAll(async () => {
  await mkdir(REPORT_DIR, { recursive: true });
});

test.describe("accessibility audit", () => {
  for (const app of apps) {
    test(`${app.slug}: zero critical axe violations`, async ({ page }) => {
      const url = originForApp(app, BASE_URL);
      const response = await page.goto(url, { waitUntil: "networkidle" });

      // Skip apps that didn't render — auth-gated apps without a session
      // bounce to the auth hub, which is itself audited via app slug "auth".
      const status = response?.status() ?? 0;
      test.skip(
        status === 0 || status >= 400,
        `${app.slug} responded ${status}; nothing to audit`,
      );

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      await writeFile(
        path.join(REPORT_DIR, `${app.slug}.json`),
        JSON.stringify(results, null, 2),
      );

      const critical = results.violations.filter((v) => v.impact === "critical");
      const serious = results.violations.filter((v) => v.impact === "serious");

      const failingImpacts = STRICT ? [...critical, ...serious] : critical;
      expect(
        failingImpacts,
        `${app.slug} has ${critical.length} critical and ${serious.length} serious violations:\n` +
          failingImpacts
            .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
            .join("\n"),
      ).toEqual([]);
    });
  }
});
