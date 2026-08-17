import { test, expect } from '@playwright/test';

test.describe('Journal Branch — fixed position, scrubbed by scroll progress', () => {
  test('branch top tracks scroll progress and stays on screen throughout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/en/journal');
    await page.waitForTimeout(2500);

    const branch = page.locator('[data-jr-branch]');
    await expect(branch).toBeVisible();

    const readTop = async () => {
      const box = await branch.boundingBox();
      const position = await branch.evaluate((el) => window.getComputedStyle(el).position);
      return { y: box?.y, position };
    };

    const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    console.log('Total scrollable distance:', total);

    const samples: { scrollY: number; y: number | undefined }[] = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const target = Math.round((total * i) / steps);
      await page.evaluate((y) => window.scrollTo(0, y), target);
      await page.waitForTimeout(250);
      const { y, position } = await readTop();
      expect(position).toBe('fixed');
      samples.push({ scrollY: target, y });
      await expect(branch).toBeVisible();
      await page.screenshot({ path: `test-results/branch-fixed-${i}.png` });
    }

    console.log('Samples (scrollY -> branch viewport Y):', samples);

    // With position:fixed, the branch's on-screen Y should move smoothly and
    // monotonically as scroll progresses from 0 -> total (top: 14vh -> 78vh),
    // and never jump backward.
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].y!).toBeGreaterThanOrEqual(samples[i - 1].y! - 1);
    }

    // Compute rough "speed": total branch travel vs total scroll travel.
    // It should be a fraction of viewport height, not thousands of px —
    // i.e. it should NOT outrun normal scroll speed.
    const branchTravel = samples[samples.length - 1].y! - samples[0].y!;
    console.log('Branch on-screen travel (px):', branchTravel, 'over scroll of', total);
    expect(branchTravel).toBeLessThan(1080); // less than one viewport height of on-screen movement
  });
});
