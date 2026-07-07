import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Nostrum Next.js app.
 * Docs: https://playwright.dev/docs/test-configuration
 */
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // Fail the build on CI if you accidentally left test.only in the source.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel workers on CI for stabler runs.
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /**
   * Auto-start the Next.js dev server before tests and reuse it locally.
   * On CI it always boots a fresh server.
   */
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
