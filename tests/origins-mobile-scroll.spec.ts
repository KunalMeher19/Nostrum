import { test, expect, devices } from "@playwright/test";

const phone = devices["iPhone 13"];

test.use({ ...phone, browserName: "chromium", viewport: { width: 390, height: 844 } });

async function dispatchSwipe(
  page: import("@playwright/test").Page,
  startY: number,
  endY: number,
  continueAfterMs = 0
) {
  return page.evaluate(async ({ startY, endY, continueAfterMs }) => {
    const root = document.querySelector<HTMLElement>(".story-scenes");
    if (!root) throw new Error("Origins story scenes are missing");

    const touch = (clientY: number) =>
      new Touch({ identifier: 1, target: root, clientX: 180, clientY });
    root.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [touch(startY)],
        changedTouches: [touch(startY)],
      })
    );
    const firstMove = new TouchEvent("touchmove", {
      bubbles: true,
      cancelable: true,
      touches: [touch(endY)],
      changedTouches: [touch(endY)],
    });
    root.dispatchEvent(firstMove);

    if (continueAfterMs > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, continueAfterMs));
      const residualTouch = touch(endY - 50);
      const residualMove = new TouchEvent("touchmove", {
        bubbles: true,
        cancelable: true,
        touches: [residualTouch],
        changedTouches: [residualTouch],
      });
      root.dispatchEvent(residualMove);
      return { firstMoveDefaultPrevented: firstMove.defaultPrevented, residualMoveDefaultPrevented: residualMove.defaultPrevented };
    }

    return { firstMoveDefaultPrevented: firstMove.defaultPrevented };
  }, { startY, endY, continueAfterMs });
}

test.describe("Origins mobile slide handoff", () => {
  test("keeps the entry swipe locked through the final slide", async ({ page }) => {
    await page.goto("/en/origins");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".story-scenes.is--mobile-slideshow")).toBeVisible();
    await page.waitForTimeout(2500);

    await dispatchSwipe(page, 620, 520);
    await page.waitForTimeout(1500);
    await expect(page.locator('.story-scenes__scene[data-index="1"].is--current')).toBeVisible();

    const before = await page.evaluate(() => window.scrollY);
    const result = await dispatchSwipe(page, 620, 520, 1400);
    await expect(page.locator('.story-scenes__scene[data-index="2"].is--current')).toBeVisible();

    expect(result.firstMoveDefaultPrevented).toBe(true);
    expect(result.residualMoveDefaultPrevented).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);

    const handoff = await dispatchSwipe(page, 620, 520);
    expect(handoff.firstMoveDefaultPrevented).toBe(false);
  });
});
