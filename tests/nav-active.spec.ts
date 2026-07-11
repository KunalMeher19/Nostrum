import { test, expect } from "@playwright/test";

/**
 * Regression test for the sidebar scroll-spy highlight.
 *
 * Bug: on first load the sidebar lit "Products" as the current section while
 * the page was actually at the top hero (Home). Cause — the scroll-spy's first
 * compute() ran during the hero's loading phase. Then #story is display:none
 * (correctly skipped) but #products is only visibility:hidden, so it KEEPS its
 * layout box and, with the hero + Story out of flow, rises to scrollY 0 where
 * the spy latched it as active. Lenis stays stopped at the hero (no scroll
 * event) so the stale "Products" highlight never got corrected.
 *
 * Fix (UnderlayNav.tsx): compute() bails to "Home" while is--loading is set,
 * and a MutationObserver recomputes the moment the hero goes live.
 */
test.describe("sidebar active-section highlight", () => {
  test("is Home (not Products) at the top hero after the intro", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for the intro to finish so we're testing the real post-load state,
    // where the earlier bug left "Products" wrongly latched.
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

    // Exactly one link carries aria-current="page" (the gold is--current
    // highlight), and it must be Home — not Products. Read textContent rather
    // than innerText so the assertion doesn't depend on the menu being open /
    // the link being painted (innerText returns "" for not-yet-visible nodes).
    const current = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(".underlay-nav__link-large[aria-current='page']")
      ).map((el) => (el.textContent || "").trim())
    );

    expect(current).toEqual(["Home"]);
  });
});
