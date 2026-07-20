"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./route-curtain.css";
import { markClientNavigation } from "./curtainNav";
import { getLenis } from "../SmoothScroll/lenisStore";

/* ---- Route → display name ------------------------------------ */
// The label shown mid-transition. Longest-prefix match so dynamic
// segments (/product/[id]) resolve too; unknown routes fall back to a
// title-cased first segment so new pages never show a blank curtain.
const ROUTE_NAMES: Array<[prefix: string, label: string]> = [
  ["/products", "Our Products"],
  ["/product", "The Collection"],
  ["/origins", "Our Origins"],
  ["/journal", "Journal"],
  ["/contact", "Contact"],
  ["/", "Home"],
];

function routeNameFor(pathname: string): string {
  for (const [prefix, label] of ROUTE_NAMES) {
    if (prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)) {
      return label;
    }
  }
  const seg = pathname.split("/").filter(Boolean)[0] ?? "Home";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

/**
 * RouteCurtain — the "drape" route-transition loader.
 *
 * A fixed full-viewport SVG curtain sweeps DOWN over the old page (deep
 * ink-olive panel with a golden leading lip — the brand's light-streak
 * signature on the drape edge), holds while the destination's name rises in
 * with a masked char stagger, swaps the route underneath while fully
 * covered, then continues the same downward sweep off the bottom to reveal
 * the new page.
 *
 * Mechanics (see the drape spec): ONE curved boundary — a quadratic with two
 * pinned corner heights (yL / yR) and a sagging mid control point (yMid) —
 * swept top→bottom for both halves. Open = curtain pinned to the top, the
 * curve is its bottom edge (area ABOVE the curve is curtain). Close = same
 * coordinates re-anchored to the bottom (area BELOW the curve is curtain),
 * so the boundary keeps travelling downward and the new page is revealed
 * behind it. The L/R stagger + the mid-point leading past the corners is
 * what reads as cloth instead of a flat wipe.
 *
 * Navigation is intercepted with a document CAPTURE-phase click listener
 * (Next's <Link> preventDefaults + pushes in its own handler, so bubble
 * phase is too late). Landing-page section links (data-section-link /
 * data-home-link) are left alone on "/" — they're in-page Lenis scrolls,
 * not navigations. Every curtain navigation calls markClientNavigation()
 * so CrispHeader skips its long first-load intro (the curtain IS the
 * loader on client-side moves; the hero cinematic stays a hard-load-only
 * experience).
 *
 * Reduced motion: no curtain — links still route client-side (and still
 * mark the navigation so the hero intro is skipped), just without the
 * animation.
 */

/* Viewbox-unit constants (SVG viewBox is 0 0 100 100, non-uniform scale). */
const COVERED = 112; // corner height at "fully covering" — past 100 so the gold lip is offscreen too
const EXIT = 118; // close sweep target — everything past the bottom edge
const LIP = 3.2; // thickness of the golden leading edge, viewBox units

export default function RouteCurtain() {
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Live pathname + a resolver armed by the transition sequence: the
  // pathname effect below settles the promise the moment the destination
  // route has actually rendered, so the curtain never lifts on the old page.
  const pathnameRef = useRef(pathname);
  const routeSettleRef = useRef<{ path: string; resolve: () => void } | null>(
    null
  );

  useEffect(() => {
    pathnameRef.current = pathname;
    const pending = routeSettleRef.current;
    if (pending && pathname === pending.path) {
      routeSettleRef.current = null;
      pending.resolve();
    }
  }, [pathname]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReducedMotion = !!window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cancelled = false;
    let transitioning = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    let runTransition: ((path: string, name: string) => void) | null = null;

    (async () => {
      const gsapMod = await import("gsap");
      if (cancelled) return;
      const gsap = gsapMod.gsap ?? gsapMod.default;

      ctx = gsap.context(() => {
        const darkPath = root.querySelector<SVGPathElement>(
          "[data-curtain-dark]"
        )!;
        const goldPath = root.querySelector<SVGPathElement>(
          "[data-curtain-gold]"
        )!;
        const labelEl = root.querySelector<HTMLElement>(
          "[data-curtain-label]"
        )!;
        const eyebrowEl = root.querySelector<HTMLElement>(
          "[data-curtain-eyebrow]"
        )!;
        if (!darkPath || !goldPath || !labelEl || !eyebrowEl) return;

        /* ---- Drape state + draw ------------------------------- */
        // One tweened state drives both paths every frame. `anchor` flips
        // which side of the curve is filled — top for the covering sweep,
        // bottom for the revealing sweep (same downward travel).
        const drape = {
          yL: 0,
          yR: 0,
          yMid: 0,
          anchor: "top" as "top" | "bottom",
        };

        const draw = () => {
          const { yL, yR, yMid, anchor } = drape;
          if (anchor === "top") {
            // Curtain hangs from the top; curve = bottom edge. Gold lip
            // extends LIP units past the dark edge, leading the sweep.
            darkPath.setAttribute(
              "d",
              `M0,0 L100,0 L100,${yR} Q50,${yMid} 0,${yL} Z`
            );
            goldPath.setAttribute(
              "d",
              `M0,0 L100,0 L100,${yR + LIP} Q50,${yMid + LIP} 0,${yL + LIP} Z`
            );
          } else {
            // Curtain pinned to the bottom; curve = top edge. Gold lip sits
            // ABOVE the dark edge so it still leads the downward reveal.
            darkPath.setAttribute(
              "d",
              `M0,100 L100,100 L100,${yR} Q50,${yMid} 0,${yL} Z`
            );
            goldPath.setAttribute(
              "d",
              `M0,100 L100,100 L100,${Math.max(yR - LIP, -2)} Q50,${Math.max(
                yMid - LIP,
                -2
              )} 0,${Math.max(yL - LIP, -2)} Z`
            );
          }
        };
        draw();

        /* ---- The two sweeps, as awaitable timelines ----------- */
        // Open: curtain drops from the top and covers. The right corner
        // lags the left slightly and the mid control point overshoots —
        // the diagonal + sag that reads as dragged cloth.
        const openCurtain = () =>
          new Promise<void>((resolve) => {
            drape.anchor = "top";
            drape.yL = drape.yR = drape.yMid = 0;
            gsap
              .timeline({ onUpdate: draw, onComplete: resolve })
              .to(drape, { yL: COVERED, duration: 0.55, ease: "expo.out" }, 0)
              .to(
                drape,
                { yR: COVERED, duration: 0.55, ease: "expo.out" },
                0.08
              )
              .to(
                drape,
                { yMid: COVERED + 20, duration: 0.5, ease: "power3.out" },
                0
              )
              .to(drape, {
                yMid: COVERED,
                duration: 0.22,
                ease: "power2.inOut",
              });
          });

        // Close: the boundary keeps travelling down, now revealing the new
        // page above it. Slower + more drape than the open, right leads.
        const closeCurtain = () =>
          new Promise<void>((resolve) => {
            drape.anchor = "bottom";
            drape.yL = drape.yR = drape.yMid = 0;
            gsap
              .timeline({ onUpdate: draw, onComplete: resolve })
              .to(drape, { yR: EXIT, duration: 0.85, ease: "power3.inOut" }, 0)
              .to(
                drape,
                { yL: EXIT, duration: 0.85, ease: "power3.inOut" },
                0.08
              )
              .to(
                drape,
                { yMid: EXIT + 18, duration: 0.9, ease: "power4.inOut" },
                0.04
              );
          });

        /* ---- Label (masked char rise) ------------------------- */
        // The destination name, one span per char inside an overflow-hidden
        // line — chars rise in with a stagger, then lift out fast before
        // the reveal. Rebuilt per navigation (the text changes each time).
        const showLabel = (name: string) =>
          new Promise<void>((resolve) => {
            labelEl.innerHTML = name
              .split("")
              .map(
                (c) =>
                  `<span class="route-curtain__char">${
                    c === " " ? "&nbsp;" : c
                  }</span>`
              )
              .join("");
            const chars = labelEl.querySelectorAll(".route-curtain__char");
            gsap
              .timeline({ onComplete: resolve })
              .fromTo(
                eyebrowEl,
                { autoAlpha: 0, y: 12 },
                { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
                0
              )
              .fromTo(
                chars,
                { yPercent: 115 },
                {
                  yPercent: 0,
                  duration: 0.7,
                  ease: "expo.out",
                  stagger: 0.035,
                },
                0.05
              );
          });

        const hideLabel = () =>
          new Promise<void>((resolve) => {
            const chars = labelEl.querySelectorAll(".route-curtain__char");
            gsap
              .timeline({ onComplete: resolve })
              .to(chars, {
                yPercent: -115,
                duration: 0.3,
                ease: "power2.in",
                stagger: 0.02,
              })
              .to(
                eyebrowEl,
                { autoAlpha: 0, duration: 0.2, ease: "power1.in" },
                0
              );
          });

        /* ---- Route swap under cover --------------------------- */
        // Push the new route and wait until React has actually rendered it
        // (the pathname effect resolves), with a timeout net so a slow or
        // failed navigation can never strand the curtain over the screen.
        const settleRoute = (path: string) =>
          new Promise<void>((resolve) => {
            if (pathnameRef.current === path) return resolve();
            routeSettleRef.current = { path, resolve };
            window.setTimeout(() => {
              if (routeSettleRef.current?.path === path) {
                routeSettleRef.current = null;
                resolve();
              }
            }, 4000);
          });

        const wait = (ms: number) =>
          new Promise<void>((r) => window.setTimeout(r, ms));

        runTransition = async (path: string, name: string) => {
          transitioning = true;
          root.classList.add("is--active");

          try {
            await openCurtain();
            // Fully covered — bring the name up while the route swaps.
            const labelIn = showLabel(name);
            markClientNavigation();
            router.push(path);
            await Promise.all([labelIn, settleRoute(path)]);

            // New page is mounted beneath the curtain: reset scroll while
            // nothing is visible. The hero manages Lenis itself on "/"
            // (stopped for its slideshow); on every other route make sure
            // Lenis is running — the hero stops the shared instance and
            // nothing else restarts it after a client-side departure.
            const lenis = getLenis();
            lenis?.scrollTo(0, { immediate: true, force: true });
            if (path !== "/") lenis?.start();
            window.scrollTo(0, 0);

            await wait(300); // readable beat on the name
            await hideLabel();
            await closeCurtain();
          } finally {
            root.classList.remove("is--active");
            labelEl.innerHTML = "";
            transitioning = false;
          }
        };
      }, root);
    })();

    /* ---- Click interception (capture phase) ------------------- */
    // Must run BEFORE Next's <Link> handler (which preventDefaults + pushes
    // itself), hence document capture. Bubble-phase element handlers (the
    // nav's section-scroll interceptors, Link's router push suppressed by
    // our preventDefault) still run afterwards untouched.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as HTMLElement).closest?.("a[href]");
      if (!a) return;
      if (a.getAttribute("target") && a.getAttribute("target") !== "_self")
        return;

      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      // Landing-page section links scroll in-page on "/" — never curtain
      // them there. From any other route they become a navigation home.
      const isSectionLink =
        a.hasAttribute("data-section-link") || a.hasAttribute("data-home-link");
      if (isSectionLink && pathnameRef.current === "/") return;

      // Same route (incl. hash-only changes): let the default happen.
      if (url.pathname === pathnameRef.current) return;

      if (transitioning) {
        // One transition at a time — swallow stray clicks mid-flight.
        e.preventDefault();
        return;
      }

      e.preventDefault();

      if (prefersReducedMotion || !runTransition) {
        // No curtain, but still a client-side route + hero-intro skip.
        markClientNavigation();
        router.push(url.pathname + url.hash);
        return;
      }

      runTransition(url.pathname, routeNameFor(url.pathname));
    };

    document.addEventListener("click", onClick, true);

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick, true);
      ctx?.revert();
    };
    // router is stable; pathname changes are tracked via pathnameRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="route-curtain" aria-hidden="true">
      <svg
        className="route-curtain__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Gold lip first (painted beneath), dark panel on top — the lip is
            whatever sticks out past the dark edge. */}
        <path data-curtain-gold className="route-curtain__gold" d="" />
        <path data-curtain-dark className="route-curtain__dark" d="" />
      </svg>

      <div className="route-curtain__center">
        <p data-curtain-eyebrow className="route-curtain__eyebrow">
          Nostrum
        </p>
        <p data-curtain-label className="route-curtain__label" />
      </div>
    </div>
  );
}
