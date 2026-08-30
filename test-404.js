const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to 404 page
  await page.goto('http://localhost:3000/en/test-404-page', { waitUntil: 'networkidle' });

  // Wait a bit for any animations
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: '404-current-state.png', fullPage: true });

  console.log('Screenshot saved as 404-current-state.png');

  await browser.close();
})();
