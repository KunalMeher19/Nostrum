import { test, devices } from '@playwright/test';

const iPhone13 = devices['iPhone 13'];

test.describe('Manual Browser Inspection', () => {
  test('Open website and keep browser open for manual inspection', async ({ browser }) => {
    const context = await browser.newContext({
      ...iPhone13,
      // Keep the browser visible
      viewport: { width: 390, height: 844 }
    });

    const page = await context.newPage();

    console.log('\n🌐 Opening Nostrum website in mobile view...\n');

    // Navigate to home page
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    console.log('✅ Home page loaded');

    // Wait for hero animation
    await page.waitForTimeout(3000);

    // Scroll to collection section
    console.log('\n📱 Scrolling to collection section...');
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(2000);

    // Check if slider is visible
    const sliderVisible = await page.locator('.slider__section').isVisible();
    const gridVisible = await page.locator('.shop__grid').isVisible();

    console.log(`\n📊 Current Layout:`);
    console.log(`   Slider visible: ${sliderVisible}`);
    console.log(`   Grid visible: ${gridVisible}`);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/manual-mobile-home.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved: tests/screenshots/manual-mobile-home.png');

    // Test slider interaction
    if (sliderVisible) {
      console.log('\n🎯 Testing slider interaction...');

      const nextButton = page.locator('[data-slider-button="next"]');
      await nextButton.click();
      console.log('   ✅ Next button clicked');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'tests/screenshots/manual-mobile-slider-next.png',
        fullPage: false
      });

      const prevButton = page.locator('[data-slider-button="prev"]');
      await prevButton.click();
      console.log('   ✅ Previous button clicked');
      await page.waitForTimeout(1000);
    }

    // Scroll through the page
    console.log('\n📜 Scrolling through entire page...');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1000);

    // Scroll down slowly to check for lag
    for (let i = 0; i < 5; i++) {
      await page.evaluate((step) => {
        window.scrollBy({ top: window.innerHeight * 0.3, behavior: 'smooth' });
      }, i);
      await page.waitForTimeout(500);
    }

    console.log('   ✅ Smooth scrolling test complete');

    // Check other pages
    const pages = [
      { url: '/en/products', name: 'Products' },
      { url: '/en/origins', name: 'Origins' },
      { url: '/en/journal', name: 'Journal' },
      { url: '/en/contact', name: 'Contact' },
    ];

    for (const pageInfo of pages) {
      console.log(`\n🔗 Navigating to ${pageInfo.name}...`);
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      if (hasOverflow) {
        console.log(`   ⚠️  Horizontal overflow detected!`);
      } else {
        console.log(`   ✅ No horizontal overflow`);
      }

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/manual-mobile-${pageInfo.name.toLowerCase()}.png`,
        fullPage: true
      });
      console.log(`   📸 Screenshot saved`);
    }

    // Go back to home and test touch gestures
    console.log('\n🏠 Returning to home page...');
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Scroll to products
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(2000);

    // Try touch gesture on slider
    if (sliderVisible) {
      console.log('\n👆 Testing touch swipe gesture...');
      const sliderList = page.locator('[data-slider="list"]');
      const box = await sliderList.boundingBox();

      if (box) {
        // Simulate swipe left
        const startX = box.x + box.width * 0.7;
        const endX = box.x + box.width * 0.3;
        const y = box.y + box.height / 2;

        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y, { steps: 20 });
        await page.mouse.up();

        await page.waitForTimeout(1000);
        console.log('   ✅ Swipe gesture completed');

        await page.screenshot({
          path: 'tests/screenshots/manual-mobile-after-swipe.png',
          fullPage: false
        });
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ MANUAL INSPECTION COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nAll screenshots saved to: tests/screenshots/');
    console.log('\nReview the screenshots to verify:');
    console.log('  • Mobile slider looks premium');
    console.log('  • No layout breaks');
    console.log('  • Typography scales correctly');
    console.log('  • Touch targets are properly sized');
    console.log('  • No horizontal overflow');
    console.log('  • Smooth animations');
    console.log('\n');

    // Keep browser open for 30 seconds for manual inspection
    console.log('⏱️  Keeping browser open for 30 seconds...');
    console.log('   (You can manually interact with the page now)\n');
    await page.waitForTimeout(30000);

    await context.close();
  });
});
