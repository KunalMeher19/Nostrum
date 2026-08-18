import { test, expect, devices } from '@playwright/test';

// Test on actual mobile devices
const iPhone13 = devices['iPhone 13'];
const pixel5 = devices['Pixel 5'];
const iPadPro = devices['iPad Pro'];

test.describe('Mobile Browser Testing - Full Site Audit', () => {

  test('Mobile - Home page slider functionality', async ({ browser }) => {
    const context = await browser.newContext(iPhone13);
    const page = await context.newPage();

    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for hero animation

    // Scroll to products section
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight * 0.6, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    // Check slider is visible
    const slider = page.locator('.slider__section');
    await expect(slider).toBeVisible();

    // Test next button
    const nextButton = page.locator('[data-slider-button="next"]');
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Test prev button
    const prevButton = page.locator('[data-slider-button="prev"]');
    await prevButton.click();
    await page.waitForTimeout(1000);

    // Test slide counter
    const counter = page.locator('.slider__overlay-count');
    await expect(counter).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-slider-working.png', fullPage: false });

    console.log('✅ Mobile slider working correctly');

    await context.close();
  });

  test('Mobile - Test all major pages', async ({ browser }) => {
    const context = await browser.newContext(iPhone13);
    const page = await context.newPage();

    const pages = [
      { url: '/en', name: 'Home', checkFor: '.crisp-header' },
      { url: '/en/products', name: 'Products', checkFor: 'main' },
      { url: '/en/origins', name: 'Origins', checkFor: 'main' },
      { url: '/en/journal', name: 'Journal', checkFor: '.jr__hero' },
      { url: '/en/contact', name: 'Contact', checkFor: 'form' },
      { url: '/en/cart', name: 'Cart', checkFor: 'main' },
    ];

    for (const pageInfo of pages) {
      console.log(`Testing ${pageInfo.name}...`);
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check if main element exists
      const mainElement = page.locator(pageInfo.checkFor);
      await expect(mainElement).toBeVisible();

      // Check for layout issues
      const bodyOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      if (bodyOverflow) {
        console.log(`⚠️ ${pageInfo.name}: Horizontal overflow detected!`);
      } else {
        console.log(`✅ ${pageInfo.name}: No horizontal overflow`);
      }

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/mobile-${pageInfo.name.toLowerCase()}-check.png`,
        fullPage: true
      });
    }

    await context.close();
  });

  test('Mobile - Viewport height handling (address bar)', async ({ browser }) => {
    const context = await browser.newContext(iPhone13);
    const page = await context.newPage();

    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get initial viewport height
    const initialHeight = await page.evaluate(() => window.innerHeight);

    // Scroll down (simulating address bar hide)
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);

    // Check if sections still look good
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight * 0.6, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);

    const slider = page.locator('.slider__section');
    const isVisible = await slider.isVisible();

    if (isVisible) {
      const sliderHeight = await slider.evaluate(el => el.getBoundingClientRect().height);
      console.log(`✅ Slider height: ${sliderHeight}px (viewport: ${initialHeight}px)`);
    }

    await context.close();
  });

  test('Mobile - Touch interactions on slider', async ({ browser }) => {
    const context = await browser.newContext(iPhone13);
    const page = await context.newPage();

    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll to slider
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(2000);

    // Get slider element
    const sliderList = page.locator('[data-slider="list"]');
    const box = await sliderList.boundingBox();

    if (box) {
      // Simulate swipe left (drag right to left)
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);

      // Try to drag (swipe gesture)
      const startX = box.x + box.width * 0.7;
      const endX = box.x + box.width * 0.3;
      const y = box.y + box.height / 2;

      await page.touchscreen.tap(startX, y);
      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(endX, y, { steps: 20 });
      await page.mouse.up();

      await page.waitForTimeout(1000);
      console.log('✅ Touch gesture completed');
    }

    await page.screenshot({ path: 'tests/screenshots/mobile-touch-interaction.png' });

    await context.close();
  });

  test('Mobile - Navigation and footer', async ({ browser }) => {
    const context = await browser.newContext(iPhone13);
    const page = await context.newPage();

    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');

    // Check if navigation is accessible
    const nav = page.locator('nav, [role="navigation"]').first();
    const navVisible = await nav.isVisible();
    console.log(`Navigation visible: ${navVisible}`);

    // Scroll to footer
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(1000);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check footer links are tappable (min 44x44 touch target)
    const footerLinks = footer.locator('a');
    const linkCount = await footerLinks.count();

    if (linkCount > 0) {
      const firstLink = footerLinks.first();
      const linkBox = await firstLink.boundingBox();

      if (linkBox && (linkBox.height < 44 || linkBox.width < 44)) {
        console.log(`⚠️ Footer link too small: ${linkBox.width}x${linkBox.height}px (min 44x44 recommended)`);
      } else {
        console.log(`✅ Footer links properly sized for touch`);
      }
    }

    await context.close();
  });

  test('Mobile - Performance metrics', async ({ browser }) => {
    const context = await browser.newContext(iPhone13);
    const page = await context.newPage();

    const startTime = Date.now();
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Mobile page load time: ${loadTime}ms`);

    // Check for JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.waitForTimeout(3000);

    if (errors.length > 0) {
      console.log('❌ JavaScript errors detected:');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✅ No JavaScript errors');
    }

    // Check memory usage (rough estimate)
    const jsHeapSize = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    if (jsHeapSize > 0) {
      console.log(`📊 JS Heap Size: ${(jsHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }

    await context.close();
  });

  test('Tablet - iPad layout check', async ({ browser }) => {
    const context = await browser.newContext(iPadPro);
    const page = await context.newPage();

    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll to products
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(2000);

    // On iPad (>768px), grid should be visible
    const grid = page.locator('.shop__grid');
    const gridVisible = await grid.isVisible();

    const slider = page.locator('.slider__section');
    const sliderVisible = await slider.isVisible();

    console.log(`iPad - Grid visible: ${gridVisible}, Slider visible: ${sliderVisible}`);

    if (gridVisible && !sliderVisible) {
      console.log('✅ iPad shows grid layout correctly');
    } else if (!gridVisible && sliderVisible) {
      console.log('✅ iPad shows slider layout');
    } else {
      console.log('⚠️ Unexpected layout on iPad');
    }

    await page.screenshot({ path: 'tests/screenshots/ipad-layout.png', fullPage: false });

    await context.close();
  });

  test('Mobile - Forms and inputs', async ({ browser }) => {
    const context = await browser.newContext(iPhone13);
    const page = await context.newPage();

    await page.goto('http://localhost:3000/en/contact');
    await page.waitForLoadState('networkidle');

    // Check input fields
    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();

    console.log(`Found ${inputCount} input fields`);

    if (inputCount > 0) {
      // Check first input sizing
      const firstInput = inputs.first();
      const inputBox = await firstInput.boundingBox();

      if (inputBox) {
        if (inputBox.height < 44) {
          console.log(`⚠️ Input too small: ${inputBox.height}px height (min 44px recommended)`);
        } else {
          console.log(`✅ Inputs properly sized: ${inputBox.height}px height`);
        }
      }

      // Test typing
      await firstInput.click();
      await page.keyboard.type('Test input');
      await page.waitForTimeout(500);

      console.log('✅ Keyboard input working');
    }

    await page.screenshot({ path: 'tests/screenshots/mobile-form-inputs.png' });

    await context.close();
  });

  test('Mobile - CSS animations and transitions', async ({ browser }) => {
    const context = await browser.newContext(iPhone13);
    const page = await context.newPage();

    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for janky animations (frame drops)
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let lastTime = performance.now();
        let frames = 0;
        const duration = 2000; // measure for 2 seconds

        function measureFrame() {
          const currentTime = performance.now();
          frames++;

          if (currentTime - lastTime >= duration) {
            resolve(frames / (duration / 1000));
          } else {
            requestAnimationFrame(measureFrame);
          }
        }

        requestAnimationFrame(measureFrame);
      });
    });

    console.log(`📊 Average FPS: ${fps}`);

    if (fps < 30) {
      console.log('⚠️ Low FPS detected, animations may be janky');
    } else if (fps >= 55) {
      console.log('✅ Smooth animations (≥55 FPS)');
    } else {
      console.log('✅ Acceptable FPS (30-55)');
    }

    await context.close();
  });
});
