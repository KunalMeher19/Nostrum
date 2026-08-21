import { test, expect } from '@playwright/test';

test.describe('Journal Branch Full Journey', () => {
  test('verify branch travels through entire blog section', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/en/journal');
    await page.waitForTimeout(3000);

    const branch = page.locator('[data-jr-branch]');

    // Position 1: At the top (hero)
    const pos1 = await branch.boundingBox();
    await page.screenshot({ path: 'test-results/branch-journey-1-hero.png' });
    console.log('1. Hero section - Branch Y:', pos1?.y);

    // Position 2: "Written along the way" title
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    const pos2 = await branch.boundingBox();
    await page.screenshot({ path: 'test-results/branch-journey-2-title.png' });
    console.log('2. Blog title - Branch Y:', pos2?.y);

    // Position 3: First blog post
    const firstPost = page.locator('[data-jr-story]').first();
    await firstPost.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const pos3 = await branch.boundingBox();
    await page.screenshot({ path: 'test-results/branch-journey-3-first-blog.png' });
    console.log('3. First blog post - Branch Y:', pos3?.y);

    // Position 4: Middle of blog posts
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    const pos4 = await branch.boundingBox();
    await page.screenshot({ path: 'test-results/branch-journey-4-mid-blogs.png' });
    console.log('4. Middle of blogs - Branch Y:', pos4?.y);

    // Position 5: End of page
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    const pos5 = await branch.boundingBox();
    await page.screenshot({ path: 'test-results/branch-journey-5-bottom.png' });
    console.log('5. Bottom - Branch Y:', pos5?.y);

    // The branch is portaled outside [data-main] and stays fixed in the
    // viewport while the journal content travels underneath it.
    expect(await branch.evaluate((element) => element.parentElement?.tagName)).toBe("BODY");
    expect(Math.abs(pos2!.y - pos1!.y)).toBeLessThan(4);
    expect(Math.abs(pos3!.y - pos1!.y)).toBeLessThan(4);
    expect(Math.abs(pos4!.y - pos1!.y)).toBeLessThan(4);
    expect(Math.abs(pos5!.y - pos1!.y)).toBeLessThan(4);

    // Verify branch is always visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await expect(branch).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(300);
    await expect(branch).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    await expect(branch).toBeVisible();

    console.log('✅ Branch stays sticky through the entire page');
    console.log('✅ Viewport movement:', (pos5!.y - pos1!.y).toFixed(1), 'pixels');
  });
});
