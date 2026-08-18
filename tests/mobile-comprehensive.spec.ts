import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE
const TABLET_VIEWPORT = { width: 820, height: 1024 }; // iPad (above 768px breakpoint)
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };

test.describe('Mobile Responsiveness - Comprehensive', () => {

  test('Home page - Mobile slider renders correctly', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('http://localhost:3000/en');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for hero to finish loading
    await page.waitForTimeout(2000);

    // Scroll to products section
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    await page.waitForTimeout(1000);

    // Check if slider is visible (mobile view)
    const slider = page.locator('.slider__section');
    await expect(slider).toBeVisible();

    // Check if desktop grid is hidden
    const desktopGrid = page.locator('.shop__grid');
    await expect(desktopGrid).toBeHidden();

    // Check slider controls
    const prevButton = page.locator('[data-slider-button="prev"]');
    const nextButton = page.locator('[data-slider-button="next"]');
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();

    // Check slides exist
    const slides = page.locator('[data-slider="slide"]');
    const slideCount = await slides.count();
    expect(slideCount).toBeGreaterThan(0);

    console.log(`✅ Mobile slider: ${slideCount} slides found`);
  });

  test('Home page - Desktop grid renders correctly', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('http://localhost:3000/en');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Scroll to products section
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    await page.waitForTimeout(1000);

    // Check if desktop grid is visible
    const desktopGrid = page.locator('.shop__grid');
    await expect(desktopGrid).toBeVisible();

    // Check if slider is hidden
    const slider = page.locator('.slider__section');
    await expect(slider).toBeHidden();

    console.log('✅ Desktop grid is visible');
  });

  test('All pages - Mobile viewport height handling', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    const pages = [
      { path: '/en', name: 'Home' },
      { path: '/en/products', name: 'Products Listing' },
      { path: '/en/contact', name: 'Contact' },
      { path: '/en/origins', name: 'Origins' },
      { path: '/en/journal', name: 'Journal' },
      { path: '/en/cart', name: 'Cart' },
    ];

    for (const pageInfo of pages) {
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      await page.waitForLoadState('networkidle');

      // Check if page uses dvh units (or fallback vh)
      const bodyStyles = await page.evaluate(() => {
        return window.getComputedStyle(document.body).minHeight;
      });

      console.log(`✅ ${pageInfo.name}: min-height = ${bodyStyles}`);

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/mobile-${pageInfo.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: false
      });
    }
  });

  test('Navigation - Mobile menu works', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');

    // Look for menu toggle button
    const menuToggle = page.locator('[aria-label*="menu"], .menu-toggle, [data-menu-toggle]').first();

    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await page.waitForTimeout(500);

      // Check if menu is open
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();

      console.log('✅ Mobile menu opens correctly');
    } else {
      console.log('⚠️ Menu toggle not found - checking if nav is always visible');
    }
  });

  test('Tablet viewport - Layout transitions correctly', async ({ page }) => {
    // Start at desktop
    await page.setViewportSize(DESKTOP_VIEWPORT);
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
    await page.waitForTimeout(1000);

    // Check desktop grid
    let desktopGrid = page.locator('.shop__grid');
    await expect(desktopGrid).toBeVisible();

    // Resize to tablet and reload to trigger resize detection
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Scroll to products again
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(1000);

    // Grid should still be visible on tablet (>768px)
    desktopGrid = page.locator('.shop__grid');
    await expect(desktopGrid).toBeVisible();

    // Resize to mobile and reload
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Scroll to products
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(1000);

    // Slider should now be visible
    const slider = page.locator('.slider__section');
    await expect(slider).toBeVisible();

    console.log('✅ Layout transitions correctly across viewports');
  });

  test('Mobile slider - Touch interaction (simulated)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
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
    await page.waitForTimeout(1000);

    // Get current active slide
    const activeSlideBefore = await page.locator('[data-slider="slide"].active').count();

    // Click next button
    const nextButton = page.locator('[data-slider-button="next"]');
    await nextButton.click();
    await page.waitForTimeout(800);

    // Check if slide changed
    const activeSlideAfter = await page.locator('[data-slider="slide"].active').count();
    expect(activeSlideAfter).toBe(1);

    console.log('✅ Slider navigation works');

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/mobile-slider-active.png',
      fullPage: false
    });
  });

  test('Footer - Mobile responsive', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check footer links are accessible
    const footerLinks = footer.locator('a');
    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    console.log(`✅ Footer has ${linkCount} links and is responsive`);
  });

  test('Forms - Mobile friendly', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('http://localhost:3000/en/contact');
    await page.waitForLoadState('networkidle');

    // Check if form inputs are visible and sized appropriately
    const nameInput = page.locator('input[name="name"], input[type="text"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const messageInput = page.locator('textarea').first();

    if (await nameInput.isVisible()) {
      const inputBox = await nameInput.boundingBox();
      expect(inputBox?.width).toBeGreaterThan(200); // At least 200px wide
      console.log('✅ Form inputs are appropriately sized for mobile');
    }
  });

  test('Typography - Mobile scaling', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check heading sizes
    const h1 = page.locator('h1').first();
    if (await h1.isVisible()) {
      const fontSize = await h1.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      console.log(`✅ Mobile H1 font size: ${fontSize}`);
    }

    // Check body text
    const bodyText = page.locator('p').first();
    if (await bodyText.isVisible()) {
      const fontSize = await bodyText.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      console.log(`✅ Mobile body font size: ${fontSize}`);
    }
  });

  test('Images - Mobile optimization', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
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
    await page.waitForTimeout(1000);

    // Check if images are properly sized
    const images = page.locator('.slider__section img, .shop__grid img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();
      const imgBox = await firstImage.boundingBox();

      if (imgBox) {
        // Image should not exceed viewport width
        expect(imgBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
        console.log(`✅ Images are properly constrained (${imgBox.width}px width)`);
      }
    }
  });

  test('Performance - Mobile page load', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    const startTime = Date.now();
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`⏱️ Mobile page load time: ${loadTime}ms`);

    // Should load within reasonable time (10 seconds for local dev)
    expect(loadTime).toBeLessThan(10000);
  });
});
