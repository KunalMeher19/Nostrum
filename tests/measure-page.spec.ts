import { test } from '@playwright/test';

test('measure page dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/en/journal');
  await page.waitForTimeout(3000);

  // Get page and section dimensions
  const dimensions = await page.evaluate(() => {
    const hero = document.querySelector('[data-jr-hero]');
    const stories = document.querySelector('[data-jr-stories]');
    const branch = document.querySelector('[data-jr-branch]');

    return {
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      heroHeight: hero?.getBoundingClientRect().height,
      heroTop: hero?.getBoundingClientRect().top,
      storiesHeight: stories?.getBoundingClientRect().height,
      storiesTop: stories?.getBoundingClientRect().top,
      branchInitialY: branch?.getBoundingClientRect().y,
      scrollY: window.scrollY
    };
  });

  console.log('Page dimensions:', dimensions);

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);

  const atBottom = await page.evaluate(() => {
    const branch = document.querySelector('[data-jr-branch]');
    return {
      scrollY: window.scrollY,
      branchY: branch?.getBoundingClientRect().y,
      pageHeight: document.documentElement.scrollHeight
    };
  });

  console.log('At bottom:', atBottom);
  console.log('Branch needs to move:', atBottom.branchY! - dimensions.branchInitialY!, 'pixels total');
});
