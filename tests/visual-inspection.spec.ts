import { test, chromium, devices } from '@playwright/test';

const iPhone13 = devices['iPhone 13'];

test('Visual mobile inspection with headed browser', async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down actions for visibility
  });

  const context = await browser.newContext(iPhone13);
  const page = await context.newPage();

  console.log('\n🌐 Opening home page in mobile view (iPhone 13)...\n');

  await page.goto('http://localhost:3000/en');
  await page.waitForLoadState('networkidle');

  console.log('✅ Page loaded - waiting 3s for animations...');
  await page.waitForTimeout(3000);

  // Scroll to products section
  console.log('\n📱 Scrolling to collection section...');
  await page.evaluate(() => {
    const productsSection = document.querySelector('#products');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(3000);

  // Check layout
  const slider = await page.locator('.slider__section').isVisible();
  const grid = await page.locator('.shop__grid').isVisible();

  console.log(`\nLayout Check:`);
  console.log(`  Mobile Slider: ${slider ? '✅ Visible' : '❌ Hidden'}`);
  console.log(`  Desktop Grid: ${grid ? '❌ Visible (should be hidden)' : '✅ Hidden'}`);

  if (slider) {
    console.log('\n🎯 Testing slider controls...');

    // Click next
    await page.locator('[data-slider-button="next"]').click();
    console.log('  ✅ Next button clicked');
    await page.waitForTimeout(1500);

    // Click prev
    await page.locator('[data-slider-button="prev"]').click();
    console.log('  ✅ Prev button clicked');
    await page.waitForTimeout(1500);
  }

  // Test other pages
  const pages = ['/en/products', '/en/origins', '/en/journal', '/en/contact'];

  for (const url of pages) {
    console.log(`\n🔗 Testing ${url}...`);
    await page.goto(`http://localhost:3000${url}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    console.log(`  ${overflow ? '⚠️ Horizontal overflow' : '✅ No overflow'}`);
  }

  console.log('\n✅ All pages tested successfully!');
  console.log('\nBrowser will stay open for manual inspection...');
  console.log('Close the browser window when done.\n');

  // Wait indefinitely - user will close browser manually
  await page.waitForTimeout(300000); // 5 minutes max
});
