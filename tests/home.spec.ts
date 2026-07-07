import { test, expect } from "@playwright/test";

/**
 * Smoke test for the Nostrum homepage.
 * baseURL comes from playwright.config.ts, so "/" hits the dev server.
 */
test.describe("homepage", () => {
  test("loads and renders content", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();

    // Page has a title and a visible <body> with some content.
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("has no obvious console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  });
});
