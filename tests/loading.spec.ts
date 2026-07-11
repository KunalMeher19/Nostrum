import { test, expect } from "@playwright/test";

/**
 * Regression tests for the load/intro phase.
 *
 * Two bugs were fixed by inlining the critical loading CSS into the SSR'd
 * <head> (see src/app/layout.tsx → CRITICAL_LOADING_CSS):
 *
 *  1. On reload, the below-hero Products section flashed first (instead of the
 *     golden load glow), because the hero's `is--hidden` display:none and the
 *     glow backdrop lived only in async-loaded stylesheets. During the gap the
 *     collapsed hero let the opaque Products/Story sections paint over the glow.
 *
 *  2. A native scrollbar appeared during loading, because the scroll-lock
 *     (overflow:hidden) was likewise only in the async stylesheet, so the full
 *     document height was briefly scrollable.
 *
 * Both are verified at DOMContentLoaded — the earliest scriptable paint — which
 * is exactly the window the bugs lived in.
 */
test.describe("loading phase", () => {
  test("first paint shows the glow, not a below-hero section, and does not scroll", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const state = await page.evaluate(() => {
      const doc = document.scrollingElement as HTMLElement;
      const topEl = document.elementFromPoint(
        window.innerWidth / 2,
        window.innerHeight / 3
      );
      return {
        // Document must be locked to a single viewport (no scrollbar, nowhere
        // for scroll-restoration to land).
        scrollLocked: doc.scrollHeight <= window.innerHeight + 1,
        htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
        // The element under the cursor must be the glow-painted <main>/hero,
        // never one of the below-hero sections.
        topTag: topEl?.tagName ?? null,
        topInProducts: !!topEl?.closest("#products"),
        topInStory: !!topEl?.closest("#story"),
      };
    });

    expect(state.scrollLocked).toBe(true);
    expect(state.htmlOverflowY).not.toBe("visible");
    expect(state.topInProducts).toBe(false);
    expect(state.topInStory).toBe(false);
  });

  test("below-hero sections are hidden until the intro finishes, then reveal", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // During loading the siblings are visibility:hidden (layout preserved for
    // ScrollTrigger, but nothing paints over the glow).
    const duringLoad = await page.evaluate(() => ({
      products: getComputedStyle(
        document.querySelector("#products") as HTMLElement
      ).visibility,
      loading: document
        .querySelector(".crisp-header")
        ?.classList.contains("is--loading"),
    }));
    expect(duringLoad.loading).toBe(true);
    expect(duringLoad.products).toBe("hidden");

    // The intro clears is--loading on its own (no scroll input needed); the
    // sections then become visible and the document expands to full height.
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              !document
                .querySelector(".crisp-header")
                ?.classList.contains("is--loading")
          ),
        { timeout: 12_000 }
      )
      .toBe(true);

    const afterIntro = await page.evaluate(() => ({
      products: getComputedStyle(
        document.querySelector("#products") as HTMLElement
      ).visibility,
      scrollable:
        (document.scrollingElement as HTMLElement).scrollHeight >
        window.innerHeight,
    }));
    expect(afterIntro.products).toBe("visible");
    expect(afterIntro.scrollable).toBe(true);
  });
});
