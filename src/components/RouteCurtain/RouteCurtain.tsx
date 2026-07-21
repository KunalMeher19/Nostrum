"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./route-curtain.css";
import { markClientNavigation, CURTAIN_REVEAL_EVENT } from "./curtainNav";
import { getLenis } from "../SmoothScroll/lenisStore";

/* ---- Route → display name ------------------------------------ */
// The label shown mid-transition. Longest-prefix match so dynamic
// segments (/product/[id]) resolve too; unknown routes fall back to a
// title-cased first segment so new pages never show a blank curtain.
const ROUTE_NAMES: Array<[prefix: string, label: string]> = [
  ["/products", "Our Products"],
  ["/product", "The Collection"],
  ["/cart", "Cart"],
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
        const mainPath = root.querySelector<SVGPathElement>(
          "[data-curtain-main]"
        )!;
        const labelEl = root.querySelector<HTMLElement>(
          "[data-curtain-label]"
        )!;
        const eyebrowEl = root.querySelector<HTMLElement>(
          "[data-curtain-eyebrow]"
        )!;
        if (!mainPath || !labelEl || !eyebrowEl) return;

        /* ---- Drape state + draw ------------------------------- */
        const drape = {
          yEdge: 0,
          yMid: 0,
          anchor: "top" as "top" | "bottom",
        };

        const draw = () => {
          const { yEdge, yMid, anchor } = drape;
          if (anchor === "top") {
            mainPath.setAttribute(
              "d",
              `M0,0 L100,0 L100,${yEdge} Q50,${yMid} 0,${yEdge} Z`
            );
          } else {
            mainPath.setAttribute(
              "d",
              `M0,100 L100,100 L100,${yEdge} Q50,${yMid} 0,${yEdge} Z`
            );
          }
        };
        draw();

        /* ---- The two sweeps, as awaitable timelines ----------- */
        const openCurtain = () =>
          new Promise<void>((resolve) => {
            drape.anchor = "top";
            drape.yEdge = 0;
            drape.yMid = 0;
            gsap
              .timeline({ onUpdate: draw, onComplete: resolve })
              .to(drape, { yEdge: COVERED, duration: 1.2, ease: "power3.inOut" }, 0)
              .to(drape, { yMid: COVERED + 25, duration: 0.7, ease: "power2.in" }, 0)
              .to(drape, { yMid: COVERED, duration: 0.5, ease: "power2.out" }, 0.7);
          });

        const closeCurtain = () =>
          new Promise<void>((resolve) => {
            drape.anchor = "bottom";
            drape.yEdge = 0;
            drape.yMid = 0;
            gsap
              .timeline({ onUpdate: draw, onComplete: resolve })
              .to(drape, { yEdge: EXIT, duration: 1.2, ease: "power3.inOut" }, 0)
              .to(drape, { yMid: EXIT + 25, duration: 0.7, ease: "power2.in" }, 0)
              .to(drape, { yMid: EXIT, duration: 0.5, ease: "power2.out" }, 0.7);
          });

        /* ---- Label ------------------------- */
        const showLabel = (name: string) =>
          new Promise<void>((resolve) => {
            labelEl.textContent = name;
            gsap
              .timeline({ onComplete: resolve })
              .fromTo(
                [eyebrowEl, labelEl],
                { autoAlpha: 0, y: 20 },
                { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 },
                0
              );
          });

        const hideLabel = () =>
          new Promise<void>((resolve) => {
            gsap
              .timeline({ onComplete: resolve })
              .to([eyebrowEl, labelEl], {
                autoAlpha: 0,
                y: -20,
                duration: 0.6,
                ease: "power2.in",
                stagger: 0.05,
              });
          });

        /* ---- Route swap under cover --------------------------- */
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
            
            // Wait for the text animation to completely finish first
            await showLabel(name);

            markClientNavigation();
            router.push(path);
            
            // Wait for route to settle
            await settleRoute(path);

            const lenis = getLenis();
            lenis?.scrollTo(0, { immediate: true, force: true });
            if (path !== "/") lenis?.start();
            window.scrollTo(0, 0);

            await wait(400); // slightly longer beat since everything is slower
            await hideLabel();
            // The reveal sweep starts NOW — let the destination page begin its
            // own entry choreography in sync with the drape lifting.
            window.dispatchEvent(new CustomEvent(CURTAIN_REVEAL_EVENT));
            await closeCurtain();
          } finally {
            root.classList.remove("is--active");
            labelEl.textContent = "";
            transitioning = false;
          }
        };
      }, root);
    })();

    /* ---- Click interception (capture phase) ------------------- */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null | undefined;
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

      const isSectionLink =
        a.hasAttribute("data-section-link") || a.hasAttribute("data-home-link");
      if (isSectionLink && pathnameRef.current === "/") return;

      if (url.pathname === pathnameRef.current) return;

      if (transitioning) {
        e.preventDefault();
        return;
      }

      e.preventDefault();

      // Single product pages open with NO drape — the Shop flow (tile →
      // product) should feel like instant shopping, not a scene change
      // (§7: the Shop stays instant, never gated). Only /product/<id> is
      // exempt; /products (the listing) and every other route keep the
      // curtain. The page itself resets the scroll + plays its own
      // entrance on mount (it can't ride the reveal event — none fires).
      const isProductDetail = /^\/product\/.+/.test(url.pathname);

      if (prefersReducedMotion || !runTransition || isProductDetail) {
        markClientNavigation();
        sessionStorage.setItem("nostrum_fresh_nav", "true");
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
  }, []);

  return (
    <div ref={rootRef} className="route-curtain" aria-hidden="true">
      <svg
        className="route-curtain__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Majority-dark brand drape: ink-black across most of the diagonal,
              with only the far corner warming into a faint golden glow — a hint
              of gold catching one edge, not a band through the middle.

              gradientUnits="userSpaceOnUse" pins the gradient to the fixed
              viewBox (0 0 → 100 100) instead of the path's per-frame bounding
              box. Without this the gold rescales as the drape morphs and reads
              as an ugly second wave of colour — especially on the exit sweep. */}
          <linearGradient
            id="curtain-grad"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="100"
            y2="100"
          >
            <stop offset="0%" stopColor="#101208" />
            <stop offset="58%" stopColor="#14160F" />
            <stop offset="82%" stopColor="#241F11" />
            <stop offset="93%" stopColor="#463818" />
            <stop offset="100%" stopColor="#7A6326" />
          </linearGradient>
        </defs>
        <path data-curtain-main className="route-curtain__main" d="" />
      </svg>

      {/* Soft radial bloom over the warm corner — gives the gold edge depth
          and a lit-from-within glow rather than a hard gradient stop. */}
      <div className="route-curtain__glow" aria-hidden="true" />

      {/* Gold sparkles — a faint scatter of twinkling motes clustered toward
          the warm corner of the drape. Purely decorative; staggered CSS
          twinkle so they never all flash together. */}
      <div className="route-curtain__sparkles" aria-hidden="true">
        <span className="route-curtain__spark" style={{ top: "62%", left: "78%", ["--d" as string]: "0s" }} />
        <span className="route-curtain__spark" style={{ top: "74%", left: "88%", ["--d" as string]: "0.9s" }} />
        <span className="route-curtain__spark" style={{ top: "83%", left: "70%", ["--d" as string]: "1.6s" }} />
        <span className="route-curtain__spark" style={{ top: "55%", left: "90%", ["--d" as string]: "0.4s" }} />
        <span className="route-curtain__spark" style={{ top: "90%", left: "84%", ["--d" as string]: "2.1s" }} />
        <span className="route-curtain__spark" style={{ top: "70%", left: "64%", ["--d" as string]: "1.2s" }} />
      </div>

      <div className="route-curtain__center">
        <p data-curtain-eyebrow className="route-curtain__eyebrow">
          Nostrum
        </p>
        <p data-curtain-label className="route-curtain__label" />
      </div>
    </div>
  );
}
