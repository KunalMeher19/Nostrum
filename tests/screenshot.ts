/**
 * Standalone screenshot helper — not a test.
 *
 * Usage (against a running dev server, or any URL):
 *   npx tsx tests/screenshot.ts                     # homepage, desktop
 *   npx tsx tests/screenshot.ts /shop mobile        # a route on mobile
 *   URL=https://example.com npx tsx tests/screenshot.ts
 *
 * Output lands in ./screenshots/ as a full-page PNG.
 */
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: devices["iPhone 13"].viewport,
} as const;

async function main() {
  const route = process.argv[2] ?? "/";
  const viewportName = (process.argv[3] ?? "desktop") as keyof typeof VIEWPORTS;
  const base = process.env.URL ?? "http://localhost:3000";
  const target = route.startsWith("http") ? route : `${base}${route}`;

  const outDir = join(process.cwd(), "screenshots");
  await mkdir(outDir, { recursive: true });

  const slug =
    (route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")) +
    `-${viewportName}`;
  const outPath = join(outDir, `${slug}.png`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORTS[viewportName] });
  console.log(`→ ${target} (${viewportName})`);
  await page.goto(target, { waitUntil: "networkidle" });
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();

  console.log(`✓ saved ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
