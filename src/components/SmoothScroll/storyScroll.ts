/**
 * storyScroll — a tiny module-level singleton that lets global UI (the
 * UnderlayNav links + NOSTRUM wordmark) drive the landing page's scroll. Every
 * sidebar link maps to an in-page section; clicking one smooth-scrolls (via
 * Lenis) to that section, and the NOSTRUM wordmark / "Home" link scroll back up
 * to the top hero.
 *
 * Why it can't be a plain anchor scroll: the hero (CrispHeader) owns a phase
 * machine that keeps Lenis STOPPED and the page locked at scrollY 0 during its
 * wheel-jacked slideshow. Reaching any section below requires flipping the hero
 * into its scroll-through phase (which starts Lenis) first. So CrispHeader
 * registers the two actions here and everyone else calls
 * `requestSectionScroll(selector)` / `requestScrollTop()`.
 *
 * Each request runs immediately if the hero is mounted, or queues the LAST
 * request until it registers — so a click from another route (which navigates
 * back to "/") still lands correctly once the hero comes alive.
 */
export type SectionScrollApi = {
  /** Smooth-scroll down to the section matching a CSS selector (e.g. "#story"). */
  toSection: (selector: string) => void;
  /** Smooth-scroll back up to the top hero slideshow. */
  toTop: () => void;
};

type QueuedRequest =
  | { kind: "section"; selector: string }
  | { kind: "top" };

let api: SectionScrollApi | null = null;
let queued: QueuedRequest | null = null;

/**
 * Called by CrispHeader to publish (or, with null, retract on unmount) the
 * scroll actions. If a request was queued while no hero existed, it fires now.
 */
export function registerStoryScroll(next: SectionScrollApi | null): void {
  api = next;
  if (next && queued) {
    const run = queued;
    queued = null;
    if (run.kind === "section") next.toSection(run.selector);
    else next.toTop();
  }
}

/**
 * Ask to scroll to a section. Returns true if handled synchronously (the hero
 * is present), false if queued for when it mounts — callers use that to decide
 * whether to also allow a navigation to "/".
 */
export function requestSectionScroll(selector: string): boolean {
  if (api) {
    api.toSection(selector);
    return true;
  }
  queued = { kind: "section", selector };
  return false;
}

/**
 * Ask to scroll back up to the top hero. Returns true if handled synchronously,
 * false if queued (e.g. clicked from another route — the page navigates to "/",
 * which already loads at the top, so the queued call is a harmless no-op).
 */
export function requestScrollTop(): boolean {
  if (api) {
    api.toTop();
    return true;
  }
  queued = { kind: "top" };
  return false;
}
