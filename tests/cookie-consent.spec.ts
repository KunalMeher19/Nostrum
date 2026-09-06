import { expect, test } from "@playwright/test";

const choiceKey = "nostrum-cookie-choice";

test.describe("cookie consent", () => {
  test("a fresh browser profile is prompted even while it is interacting with the page", async ({ page }) => {
    await page.goto("/en");
    // A new Playwright context is an isolated/private browser profile. Keep
    // interacting to ensure the prompt is time-based rather than idle-only.
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 80);

    const banner = page.getByRole("region", { name: "Cookie notice" });
    await expect(banner).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  });

  test("rejecting persists the refusal and does not load analytics", async ({ page }) => {
    await page.goto("/en");
    const banner = page.getByRole("region", { name: "Cookie notice" });
    await expect(banner).toBeVisible({ timeout: 15_000 });
    await banner.getByRole("button", { name: "Reject", exact: true }).click();

    await expect(banner).toBeHidden();
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), choiceKey)).toBe("reject");
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);

    await page.reload();
    await expect(banner).toBeHidden();
  });

  test("preferences save either an analytics opt-in or refusal", async ({ page }) => {
    await page.goto("/en");
    const banner = page.getByRole("region", { name: "Cookie notice" });
    await expect(banner).toBeVisible({ timeout: 15_000 });
    await banner.getByRole("button", { name: "Preferences", exact: true }).click();
    await banner.getByRole("checkbox", { name: "Analytics cookies" }).check();
    await banner.getByRole("button", { name: "Accept", exact: true }).click();

    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), choiceKey)).toBe("accept");
  });
});
