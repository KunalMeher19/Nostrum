import { test, expect } from '@playwright/test';

test('branch is VISIBLE throughout entire scroll - visual confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/en/journal');
  await page.waitForTimeout(3000);

  const branch = page.locator('[data-jr-branch]');

  // Check visibility at multiple points
  console.log('=== VISUAL CONFIRMATION TEST ===');

  // Top of page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await expect(branch).toBeVisible();
  await page.screenshot({ path: 'test-results/visual-top.png', fullPage: false });
  console.log('✓ Branch visible at TOP');

  // Scroll to "Written along the way" heading
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(500);
  await expect(branch).toBeVisible();
  await page.screenshot({ path: 'test-results/visual-title.png', fullPage: false });
  console.log('✓ Branch visible at TITLE');

  // Scroll to first blog post
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
  await expect(branch).toBeVisible();
  await page.screenshot({ path: 'test-results/visual-first-post.png', fullPage: false });
  console.log('✓ Branch visible at FIRST POST');

  // Scroll to middle of blog posts
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(500);
  await expect(branch).toBeVisible();
  await page.screenshot({ path: 'test-results/visual-mid-posts.png', fullPage: false });
  console.log('✓ Branch visible at MID POSTS');

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  await expect(branch).toBeVisible();
  await page.screenshot({ path: 'test-results/visual-bottom.png', fullPage: false });
  console.log('✓ Branch visible at BOTTOM');

  console.log('\n=== ALL CHECKS PASSED - Branch stays visible throughout! ===');
});
