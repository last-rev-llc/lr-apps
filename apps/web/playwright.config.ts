import { defineConfig, devices } from "@playwright/test";
import path from "path";

export const AUTH_STATE_PATH = path.join(
  __dirname,
  "tests/e2e/.auth/user.json",
);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Allow self-enroll for command-center and standup in E2E tests.
      // In dev mode (NODE_ENV=development) self-enroll is always open, but
      // CI runs next build + next start so we need the explicit list.
      APP_SELF_ENROLL_SLUGS: process.env.APP_SELF_ENROLL_SLUGS ?? "command-center,standup",
    },
  },
});
