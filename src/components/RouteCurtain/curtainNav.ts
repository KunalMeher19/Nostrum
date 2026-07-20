/**
 * curtainNav — module-level flag shared between RouteCurtain and CrispHeader.
 *
 * The hero's cinematic Willem loader is a FIRST-LOAD experience: on a hard
 * load / refresh it owns the screen. But on a client-side route change the
 * RouteCurtain drape is already covering the viewport — running the full
 * multi-second hero loader underneath (and after) it would stack two loaders
 * back-to-back. So RouteCurtain marks every curtain navigation here, and
 * CrispHeader consults the flag to jump its intro timeline straight to the
 * revealed state (all the same class flips / gates fire, just instantly).
 *
 * The flag is module-scoped, so a hard reload naturally resets it to false —
 * exactly the "hero loader only on first load" behaviour we want.
 */
let clientNavigated = false;

/** Called by RouteCurtain just before it pushes the new route. */
export function markClientNavigation(): void {
  clientNavigated = true;
}

/** True once any curtain navigation has happened this page-load. */
export function hasClientNavigated(): boolean {
  return clientNavigated;
}
