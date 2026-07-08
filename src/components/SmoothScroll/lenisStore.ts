import type Lenis from "lenis";

/**
 * Tiny module-level singleton that lets one component (SmoothScroll) own the
 * Lenis instance while others (e.g. CrispHeader's ScrollTrigger setup) read it.
 *
 * React runs effects child-first, so a consumer's effect can run BEFORE
 * SmoothScroll has created Lenis. `onLenis` handles both orders: it fires
 * immediately if the instance already exists, otherwise it queues the callback
 * until `setLenis` is called.
 */
let instance: Lenis | null = null;
const waiters = new Set<(l: Lenis) => void>();

export function setLenis(l: Lenis | null): void {
  instance = l;
  if (l) {
    for (const cb of Array.from(waiters)) cb(l);
    waiters.clear();
  }
}

export function getLenis(): Lenis | null {
  return instance;
}

/**
 * Run `cb` with the Lenis instance as soon as it exists. Returns an unsubscribe
 * function that removes a still-pending waiter (no-op once it has fired).
 */
export function onLenis(cb: (l: Lenis) => void): () => void {
  if (instance) {
    cb(instance);
    return () => {};
  }
  waiters.add(cb);
  return () => waiters.delete(cb);
}
