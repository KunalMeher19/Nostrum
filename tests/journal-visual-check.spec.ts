import { test, expect } from '@playwright/test';

test.describe('Journal SVG Visual Check', () => {
  test('capture screenshots at different scroll positions', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/en/journal');
    await page.waitForTimeout(3000);

    // Screenshot 1: Initial position
    await page.screenshot({
      path: 'test-results/journal-1-initial.png',
      fullPage: false
    });
    console.log('Screenshot 1: Initial position');

    // Scroll to "Written along the way" section
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/journal-2-halfway.png',
      fullPage: false
    });
    console.log('Screenshot 2: Halfway scroll');

    // Scroll to blog posts
    const firstBlogPost = page.locator('[data-jr-story]').first();
    await firstBlogPost.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/journal-3-at-blogs.png',
      fullPage: false
    });
    console.log('Screenshot 3: At blog posts');

    // Check branch position
    const branch = page.locator('[data-jr-branch]');
    const branchBox = await branch.boundingBox();
    console.log('Branch bounding box at blogs:', branchBox);

    // Check if branch is visible
    const isVisible = await branch.isVisible();
    console.log('Branch visible at blogs:', isVisible);

    // Scroll even further
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/journal-4-further-down.png',
      fullPage: false
    });
    console.log('Screenshot 4: Further down');

    const finalBox = await branch.boundingBox();
    console.log('Branch final position:', finalBox);
  });
});
