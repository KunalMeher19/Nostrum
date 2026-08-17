import { test, expect } from '@playwright/test';

test.describe('Journal SVG Scroll', () => {
  test('hero branch SVG should scroll through the entire page and stay visible', async ({ page }) => {
    // Navigate to journal page
    await page.goto('http://localhost:3000/en/journal');

    // Wait for the page to load and GSAP animations to initialize
    await page.waitForTimeout(2000);

    // Get the hero branch SVG element
    const branch = page.locator('[data-jr-branch]');
    await expect(branch).toBeVisible();

    // Check z-index is set so it stays on top
    const zIndex = await branch.evaluate((el) => window.getComputedStyle(el).zIndex);
    console.log('Branch z-index:', zIndex);
    expect(parseInt(zIndex)).toBeGreaterThan(0);

    // Get initial position of the branch
    const initialBox = await branch.boundingBox();
    expect(initialBox).not.toBeNull();
    console.log('Initial branch position:', initialBox);

    // Branch should be visible at start
    await expect(branch).toBeVisible();

    // Scroll down 500px
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);

    // Check branch position after first scroll
    const midBox1 = await branch.boundingBox();
    console.log('After 500px scroll:', midBox1);
    await expect(branch).toBeVisible();

    // Scroll down another 500px
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);

    // Check branch position after second scroll
    const midBox2 = await branch.boundingBox();
    console.log('After 1000px scroll:', midBox2);
    await expect(branch).toBeVisible();

    // Scroll to the stories section
    const storiesSection = page.locator('[data-jr-stories]');
    await storiesSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const storiesBox = await branch.boundingBox();
    console.log('At stories section:', storiesBox);
    await expect(branch).toBeVisible();

    // Scroll much further down through blog posts
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(300);

    const furtherBox = await branch.boundingBox();
    console.log('After scrolling through blogs:', furtherBox);

    // Branch should STILL be visible even when over blog content
    await expect(branch).toBeVisible();

    // Branch should have moved down progressively (Y position should increase)
    expect(midBox1?.y).toBeGreaterThan(initialBox?.y as number);
    expect(midBox2?.y).toBeGreaterThan(midBox1?.y as number);

    // Verify there's no duplicate sticky leaves panel
    const leavesPanel = page.locator('.jr__leaves');
    await expect(leavesPanel).toHaveCount(0);

    // Take a screenshot to visually confirm branch is visible over content
    await page.screenshot({ path: 'test-results/journal-branch-visible.png', fullPage: true });

    console.log('✓ Hero branch scrolls progressively through the page');
    console.log('✓ Branch stays visible over blog content');
    console.log('✓ No duplicate sticky leaves panel found');
  });
});
