"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./underlay-nav.css";
import { requestSectionScroll, requestScrollTop } from "../SmoothScroll/storyScroll";
import { onLenis, getLenis } from "../SmoothScroll/lenisStore";

/* ---- Navigation data ---------------------------------------- */
// On the landing page "Home" and "Our Story" are in-page scroll targets, not
// routes: clicking smooth-scrolls (via Lenis) between the top hero and the
// Story section and the sidebar lights whichever you're in. "Home" + the
// NOSTRUM wordmark scroll back up to the hero. The remaining links are ordinary
// routes. `activeHref` (scroll-spy for landing sections, route match otherwise)
// drives the gold is--current highlight.
// `children` are sub-routes nested under a landing-page section link. They
// render as an indented sub-link with an elbow connector: collapsed by
// default, smoothly revealed on hover/focus of the parent item, and pinned
// open (+ gold highlight) while their route is the current page.
const NAV_LINKS: {
  href: string;
  label: string;
  top?: boolean;
  section?: string;
  children?: { href: string; label: string }[];
}[] = [
  { href: "/", label: "Home", top: true },
  {
    href: "/#story",
    label: "Our Story",
    section: "#story",
    children: [{ href: "/origins", label: "Origins" }],
  },
  {
    href: "/#products",
    label: "Collections",
    section: "#products",
    children: [{ href: "/products", label: "Products" }],
  },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

// The section ids the scroll-spy watches, in document order. Home is "active"
// when none has yet crossed the spy line.
const SPY_SECTIONS = ["#story", "#products"];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X / Twitter", href: "#" },
];

/**
 * UnderlayNav — Rolls-Royce style full-screen menu takeover.
 *
 * Structure (all fixed / absolute):
 *   header  – top bar with Nostrum wordmark + toggle button
 *   screen  – full-viewport takeover, fades in on open (GSAP autoAlpha):
 *               blur  – live blurred pass-through of the page (backdrop-filter),
 *                       masked to fade out toward the right so the hero stays
 *                       crisp there — "matches the changing background but a bit
 *                       blurred"
 *               scrim – gentle left-weighted darkening for link legibility
 *               menu  – primary links pinned LEFT; they slide in from the left
 *                       with a stagger on open, and mirror back out on close
 *
 * The page beneath is NOT moved (unlike the old right-panel + page-push
 * pattern), so CrispHeader's transform-pinned STA is unaffected. Background
 * scroll is locked via Lenis while open (see lockScroll).
 *
 * GSAP is loaded dynamically (avoids SSR window errors).  The same
 * `cancelled` / `gsap.context()` pattern used in CrispHeader is used here
 * to handle React StrictMode double-mount cleanly.
 */
export default function UnderlayNav() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Set by the GSAP context to a routine that snaps the menu to a clean closed
  // state. The route-change effect below calls it so navigating ALWAYS lands
  // with the menu shut and the page/overlay reset — the nav stays mounted
  // across client-side navigations, so without this an open menu (or an
  // in-flight close animation cut short by the unmount) would carry its
  // slid-open overlay onto the next route.
  const closeMenuRef = useRef<(() => void) | null>(null);

  // Which nav link gets the gold is--current highlight. On the landing page a
  // scroll-spy tracks the section you're actually in: "Home" at the top hero,
  // flipping through Our Story → Products → … as each crosses the spy line.
  // On any other route the active link simply matches the URL.
  const [activeHref, setActiveHref] = useState<string>(pathname);

  useEffect(() => {
    if (pathname !== "/") {
      setActiveHref(pathname);
      return;
    }

    // The active section is the LAST one (top-to-bottom) whose top has scrolled
    // above a line ~40% down the viewport. Collapsed sections (the Story
    // section is display:none during the hero loader → rect all zeros) are
    // skipped so they don't falsely register as "at the top".
    const compute = () => {
      // Bail out entirely while the hero is still in its loading phase. Then the
      // below-hero sections aren't in their real positions: Story collapses to
      // display:none (rect zeros, skipped below), but Products is only
      // visibility:hidden — it KEEPS its box and, with the hero + Story removed
      // from flow, rises to scrollY 0 where it would latch as active and stick
      // (Lenis is stopped at the hero, so no scroll event ever recomputes it).
      // Home is always correct at the top hero, so defer to it; the observer
      // below recomputes the instant the hero goes live and geometry is real.
      if (document.querySelector(".crisp-header.is--loading")) {
        setActiveHref((prev) => (prev === "/" ? prev : "/"));
        return;
      }
      const lineY = window.innerHeight * 0.4;
      let active = "/";
      for (const sel of SPY_SECTIONS) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.height === 0) continue; // not laid out yet
        if (rect.top <= lineY) active = "/" + sel;
        else break; // sections are ordered; nothing below can qualify
      }
      setActiveHref((prev) => (prev === active ? prev : active));
    };

    compute();

    // Recompute the instant the hero leaves its loading phase. During load
    // compute() bails to "Home" (see above); Lenis is stopped at the top hero
    // and fires no scroll event, so without this the highlight would only ever
    // be corrected on the first user scroll. Watch the hero's class list for
    // is--loading dropping and recompute once with real geometry. Guarded so it
    // only runs on the landing page, where the hero exists.
    let observer: MutationObserver | undefined;
    const hero = document.querySelector(".crisp-header");
    if (hero) {
      observer = new MutationObserver(() => {
        if (!hero.classList.contains("is--loading")) compute();
      });
      observer.observe(hero, { attributes: true, attributeFilter: ["class"] });
    }

    // Ride Lenis' interpolated scroll so the highlight updates smoothly in
    // lockstep with the scroll (Lenis emits no events while it's stopped during
    // the slideshow, which is fine — we're at the top hero then anyway).
    let detach = () => {};
    const unsub = onLenis((lenis) => {
      const onScroll = () => compute();
      lenis.on("scroll", onScroll);
      detach = () => lenis.off("scroll", onScroll);
    });
    window.addEventListener("resize", compute);

    return () => {
      observer?.disconnect();
      unsub();
      detach();
      window.removeEventListener("resize", compute);
    };
  }, [pathname]);

  // On every route change, snap the menu shut. Runs after the new page has
  // mounted (so the reset targets the current [data-main]); it's idempotent, so
  // firing when the menu was already closed is a harmless no-op.
  useEffect(() => {
    closeMenuRef.current?.();
  }, [pathname]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    (async () => {
      const gsapMod = await import("gsap");
      const { CustomEase } = await import("gsap/CustomEase");
      if (cancelled) return;

      const gsap = gsapMod.gsap ?? gsapMod.default;
      gsap.registerPlugin(CustomEase);

      // The same custom ease used in the original Osmo demo.
      CustomEase.create("energy", "M0,0 C0.32,0.72 0,1 1,1");

      ctx = gsap.context(() => {
        /* ---- Element references ------------------------------- */
        const toggleBtn = root.querySelector<HTMLButtonElement>(
          "[data-underlay-nav-toggle]"
        )!;
        const toggleLabels = root.querySelectorAll<HTMLElement>(
          ".underlay-nav__toggle-label"
        );
        const toggleBars = root.querySelectorAll<HTMLElement>(
          ".underlay-nav__toggle-bar"
        );
        const menuEl = root.querySelector<HTMLElement>(
          "[data-underlay-nav-menu]"
        )!;
        const largeItems =
          root.querySelectorAll<HTMLElement>("[data-reveal-l]");
        // The full-screen takeover: a fixed layer that covers the viewport and
        // carries the blurred live-page backdrop + the left-pinned links. This
        // replaces the old right-side panel + page-push pattern with the
        // Rolls-Royce style overlay (blur on the left, page stays put beneath).
        const screenEl = root.querySelector<HTMLElement>(
          "[data-underlay-nav-screen]"
        )!;
        // The blurred backdrop + scrim. Wiped in via clip-path (left→right
        // reveal front, like RR's pane slide) rather than translateX — a
        // transformed ancestor/element would become the backdrop root and
        // disable the live backdrop-filter blur.
        const paneEls = Array.from(
          root.querySelectorAll<HTMLElement>(
            ".underlay-nav__blur, .underlay-nav__scrim"
          )
        );

        if (!toggleBtn || !menuEl || !screenEl) return;

        // Capture the toggle button's colour in both states from the CSS so
        // we never hard-code colours in JS.
        const closedColor = getComputedStyle(toggleBtn).color;
        const openColor = getComputedStyle(menuEl).color;

        let isOpen = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let tl: any;

        /* ---- Initial GSAP state (matches CSS defaults) ------- */
        // The screen starts hidden + click-through. It does NOT fade: on open
        // it snaps visible and the pane wipe IS the reveal (as on RR). The pane
        // starts off-screen via CSS transform; the timeline owns it after that.
        gsap.set(screenEl, { autoAlpha: 0, pointerEvents: "none" });
        gsap.set(toggleLabels, { yPercent: 0 });
        gsap.set(toggleBars, { y: 0, rotation: 0 });

        // Background scroll lock. The full-screen takeover shouldn't let the
        // page scroll behind it. Lenis is a shared singleton the hero also
        // drives (it stops Lenis during the slideshow / loader), so we must not
        // blindly start() it on close — that would unlock the hero mid-loader.
        // Snapshot whether Lenis was already stopped when we opened, and only
        // restore that exact state on close.
        let lenisWasStopped = false;
        function lockScroll(lock: boolean) {
          const lenis = getLenis();
          if (!lenis) return;
          if (lock) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lenisWasStopped = (lenis as any).isStopped === true;
            lenis.stop();
          } else if (!lenisWasStopped) {
            // Only resume if WE were the ones who stopped it.
            lenis.start();
          }
        }

        // How far off-screen-left the links start/end their sweep. RR uses a
        // fixed -544px at 1440w (≈ 0.38 viewport widths) regardless of link
        // length — every item travels the same long distance, which is what
        // gives the cascade its uniform "sweep" read. Function-based so resize
        // re-evaluates on the next open/close.
        const offX = () => -Math.max(window.innerWidth * 0.38, 300);

        function animateToggleButton(open: boolean) {
          gsap.to(toggleLabels, {
            yPercent: open ? -100 : 0,
            duration: 0.4,
            ease: open ? "energy" : "power3.in",
            overwrite: "auto",
          });
          gsap.to(toggleBtn, {
            color: open ? openColor : closedColor,
            duration: 0.4,
            overwrite: "auto",
          });
          gsap.to(toggleBars[0], {
            y: open ? "0.25em" : 0,
            rotation: open ? 45 : 0,
            duration: 0.35,
            ease: open ? "back.out(1.4)" : "power3.in",
            overwrite: "auto",
          });
          gsap.to(toggleBars[1], {
            y: open ? "-0.25em" : 0,
            rotation: open ? -45 : 0,
            duration: 0.35,
            ease: open ? "back.out(1.4)" : "power3.in",
            overwrite: "auto",
          });
        }

        /* ---- Build timeline ----------------------------------- */
        // Measured off the live RR menu (rAF-sampled transforms):
        //   pane  : translateX(-100% → 0), ~0.75s, strong ease-out, no fade —
        //           the wipe IS the reveal.
        //   links : each sweeps in from a fixed ~0.38·viewport off-screen-left
        //           (-544px @1440w) + fades, ~0.85s ease-out, staggered ~90ms
        //           BOTTOM-UP (the lowest link leads, the top arrives last),
        //           starting while the pane is still wiping.
        //   close : the exact mirror — reverse() gives it for free: top link
        //           accelerates out first (reversed ease-out = ease-in), bottom
        //           last, pane wipes away underneath them. ~1.5s total.
        function buildTimeline() {
          tl = gsap.timeline({
            paused: true,
            // Once fully reversed (closed), hide + disable the screen so it
            // stops intercepting clicks on the page beneath it.
            onReverseComplete: () => {
              gsap.set(screenEl, { autoAlpha: 0, pointerEvents: "none" });
            },
          });

          // 1) Blurred pane wipes in, reveal front moving left → right —
          //    measured off RR's .rrmc-menu-bg-left (translateX -100% → 0,
          //    ~0.75s strong ease-out, no fade). Done as a clip-path inset so
          //    the backdrop-filter stays live (see paneEls note).
          if (paneEls.length) {
            tl.fromTo(
              paneEls,
              { clipPath: "inset(0 100% 0 0)" },
              { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power2.out" },
              0
            );
          }

          // 2) Links sweep in over it, bottom-up (lowest leads, top arrives
          //    last) — starting while the pane is still wiping, as measured
          //    (link N starts ≈0.2s + 0.1s·(count-1-N) after the click).
          tl.fromTo(
            largeItems,
            { x: offX, autoAlpha: 0 },
            {
              x: 0,
              autoAlpha: 1,
              duration: 1.05,
              ease: "power2.out",
              stagger: { each: 0.12, from: "end" },
            },
            0.22
          );
        }

        /* ---- Toggle handler ----------------------------------- */
        function toggle() {
          isOpen = !isOpen;
          toggleBtn.setAttribute("aria-expanded", String(isOpen));
          toggleBtn.setAttribute(
            "aria-label",
            isOpen ? "close menu" : "open menu"
          );
          // Let global CSS react to the open state if needed.
          document.body.setAttribute("data-menu-status", isOpen ? "open" : "");

          // The toggle button + takeover reveal are driven directly so they
          // react instantly on every click, regardless of open/close direction.
          animateToggleButton(isOpen);

          if (isOpen) {
            // Snap the takeover live — no global fade; the pane wipe IS the
            // reveal, exactly as measured on RR.
            gsap.set(screenEl, { autoAlpha: 1, pointerEvents: "auto" });
            lockScroll(true);
            tl.timeScale(1).play();
          } else {
            // Stop intercepting clicks right away; the screen is hidden once
            // the reverse fully completes (onReverseComplete). The reverse IS
            // the exit animation: top link accelerates out first, bottom last,
            // then the pane wipes away beneath them — RR's close, mirrored.
            gsap.set(screenEl, { pointerEvents: "none" });
            lockScroll(false);
            tl.timeScale(1).reverse();
          }
        }

        // Snap the menu to a clean closed state with NO animation. Used on route
        // changes: the page just swapped, so there's nothing to gracefully
        // animate — we simply guarantee the incoming route starts with the menu
        // shut, the page/overlay un-slid, and the toggle showing "Menu". Every
        // op is idempotent, so calling this while already closed does nothing.
        function forceClose() {
          isOpen = false;
          toggleBtn.setAttribute("aria-expanded", "false");
          toggleBtn.setAttribute("aria-label", "open menu");
          document.body.setAttribute("data-menu-status", "");
          animateToggleButton(false);
          lockScroll(false); // release any scroll lock we placed
          gsap.set(screenEl, { autoAlpha: 0, pointerEvents: "none" });
          tl.pause(0); // rewind pane + link reveal to closed
        }
        closeMenuRef.current = forceClose;

        buildTimeline();

        /* ---- Event Listeners ---------------------------------- */
        // Clicking the blurred takeover background (anywhere that isn't a link
        // or the close/toggle button) closes the menu — the links sit in their
        // own column, so the rest of the screen is a big dismiss target.
        const handleScreenClick = (e: MouseEvent) => {
          if (!isOpen) return;
          const t = e.target as HTMLElement;
          if (t.closest("[data-underlay-nav-menu]")) return; // clicked a link
          toggle();
        };
        const handleKeydown = (e: KeyboardEvent) => {
          if (e.key === "Escape" && isOpen) {
            toggle();
            toggleBtn.focus();
          }
        };

        // Landing-page section links. On "/" the hero owns the scroll (Lenis
        // is stopped during the slideshow), so intercept these clicks and ask
        // the hero to scroll instead of routing:
        //   [data-section-link="#id"] → smooth-scroll down/up to that section
        //   [data-home-link]          → the "Home" link + the NOSTRUM wordmark,
        //                               scroll back up to the top hero
        // Each request returns false when no hero is mounted (clicked from
        // another route); then we let the <Link> navigate to its href and the
        // queued request runs the moment the hero registers.
        const sectionLinks = Array.from(
          root.querySelectorAll<HTMLAnchorElement>("[data-section-link]")
        );
        const homeLinks = Array.from(
          root.querySelectorAll<HTMLAnchorElement>("[data-home-link]")
        );
        const handleSectionClick = (e: MouseEvent) => {
          const selector = (e.currentTarget as HTMLElement).getAttribute(
            "data-section-link"
          );
          if (!selector) return;
          const handled = requestSectionScroll(selector);
          if (handled) {
            e.preventDefault();
            if (isOpen) toggle(); // close the menu so the scroll is unobstructed
          }
        };
        const handleHomeClick = (e: MouseEvent) => {
          const handled = requestScrollTop();
          if (handled) {
            e.preventDefault();
            if (isOpen) toggle();
          }
        };

        toggleBtn.addEventListener("click", toggle);
        screenEl.addEventListener("click", handleScreenClick);
        sectionLinks.forEach((el) =>
          el.addEventListener("click", handleSectionClick)
        );
        homeLinks.forEach((el) => el.addEventListener("click", handleHomeClick));
        document.addEventListener("keydown", handleKeydown);

        // Return cleanup from gsap.context() — runs automatically on ctx.revert()
        return () => {
          // Make sure a mid-open unmount (e.g. StrictMode double-mount) never
          // leaves Lenis stopped by us.
          lockScroll(false);
          toggleBtn.removeEventListener("click", toggle);
          screenEl.removeEventListener("click", handleScreenClick);
          sectionLinks.forEach((el) =>
            el.removeEventListener("click", handleSectionClick)
          );
          homeLinks.forEach((el) =>
            el.removeEventListener("click", handleHomeClick)
          );
          document.removeEventListener("keydown", handleKeydown);
          document.body.removeAttribute("data-menu-status");
          // Drop the reset routine so the route-change effect can't call into a
          // reverted GSAP context (e.g. StrictMode double-mount).
          if (closeMenuRef.current === forceClose) closeMenuRef.current = null;
        };
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="underlay-nav">

      {/* ---- Fixed header bar ----------------------------------- */}
      <header className="underlay-nav__header">
        <div className="underlay-nav__bar">
          <div className="underlay-nav__container">
            <Link
              href="/"
              className="underlay-nav__logo"
              aria-label="Nostrum home"
              data-home-link=""
            >
              Nostrum
            </Link>

            <button
              data-underlay-nav-toggle
              aria-expanded="false"
              aria-label="open menu"
              className="underlay-nav__toggle"
            >
              {/* Text flips between "Menu" and "Close" via yPercent animation */}
              <span className="underlay-nav__toggle-text">
                <span className="underlay-nav__toggle-label">Menu</span>
                <span className="underlay-nav__toggle-label">Close</span>
              </span>
              {/* Two bars that cross into an ✕ */}
              <span className="underlay-nav__toggle-icon">
                <span className="underlay-nav__toggle-bar" />
                <span className="underlay-nav__toggle-bar" />
              </span>
            </button>

            {/* ---- Right-side actions: cart + account ------------- */}
            {/* Placeholder buttons for now (no routes yet). Icons are the
                visible paths extracted from the Lottie-exported SVGs in
                /assests, re-inked with currentColor so they ride the same
                --nav-col auto-contrast as the wordmark + Menu toggle. */}
            <div className="underlay-nav__actions">
              <button
                type="button"
                className="underlay-nav__action"
                aria-label="Shopping cart"
              >
                <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false">
                  {/* Inner group carries the hover animation (CSS transform
                      would clobber the positioning transform if applied to the
                      translated group directly). */}
                  <g transform="translate(117.501 127.5)">
                    <g className="underlay-nav__icon-cart">
                      <path d="M61.992 0H-41.68l-18.643-72.5H90.322L74.101-9.385A12.5 12.5 0 0 1 61.992 0m43.935-84.6a7.5 7.5 0 0 0-5.928-2.9h-200a7.5 7.5 0 0 0 0 15h24.18L-55.44 6.768-42.725 15H61.992c12.55 0 23.504-8.499 26.63-20.654l18.643-72.481a7.51 7.51 0 0 0-1.338-6.465" />
                      <path d="M64.814 2.177H-45.085l-19.762-76.854H94.846L77.651-7.771a13.254 13.254 0 0 1-12.837 9.948M42.499 60c0-6.904 5.596-12.5 12.5-12.5s12.5 5.596 12.5 12.5-5.596 12.5-12.5 12.5-12.5-5.596-12.5-12.5m-105 0c0-6.904 5.596-12.5 12.5-12.5s12.5 5.596 12.5 12.5-5.596 12.5-12.5 12.5-12.5-5.596-12.5-12.5M-44.71 2.685l-10.73 4.083-18.613 39.902A27.4 27.4 0 0 0-77.501 60c0 15.188 12.312 27.5 27.5 27.5s27.5-12.312 27.5-27.5c0-4.506-1.106-8.747-3.027-12.5h56.055A27.35 27.35 0 0 0 27.499 60c0 15.188 12.312 27.5 27.5 27.5s27.5-12.312 27.5-27.5c0-14.926-11.892-27.047-26.718-27.461a8 8 0 0 0-.782-.039h-105c-.304 0-.606.029-.908.039L-42.725 15z" />
                    </g>
                  </g>
                </svg>
              </button>
              <button
                type="button"
                className="underlay-nav__action"
                aria-label="Account"
              >
                <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false">
                  <defs>
                    {/* Clips the head + shoulders to the ring's interior —
                        replaces the alpha masks in the Lottie export. */}
                    <clipPath id="nav-account-clip">
                      <circle cx="120" cy="120" r="91.154" />
                    </clipPath>
                  </defs>
                  {/* Head + shoulders slide up from inside the ring on hover
                      ("in reveal"), clipped so they emerge from below. */}
                  <g clipPath="url(#nav-account-clip)">
                    <g className="underlay-nav__icon-person">
                      <path d="M120 135c22.091 0 40-17.909 40-40s-17.909-40-40-40-40 17.909-40 40 17.909 40 40 40m0-65c13.807 0 25 11.193 25 25s-11.193 25-25 25-25-11.193-25-25 11.193-25 25-25" />
                      <path d="M182.5 235a7.5 7.5 0 0 0 7.5-7.5v-30c0-26.234-21.266-47.5-47.5-47.5h-45C71.266 150 50 171.266 50 197.5v30a7.5 7.5 0 0 0 7.5 7.5zm-40-70c17.949 0 32.5 14.551 32.5 32.5V220H65v-22.5c0-17.949 14.551-32.5 32.5-32.5z" />
                    </g>
                  </g>
                  <path
                    d="M0 100c55.228 0 100-44.772 100-100S55.228-100 0-100-100-55.228-100 0-55.228 100 0 100M0-85c46.944 0 85 38.056 85 85S46.944 85 0 85-85 46.944-85 0s38.056-85 85-85"
                    transform="translate(120 120)"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Full-screen takeover (Rolls-Royce style) ----------- */}
      {/* A fixed layer covering the viewport. The blurred live-page backdrop
          sits on the left and fades to clear on the right, so the page stays
          sharp there; the links are pinned left. The whole layer fades in on
          open — the page beneath is NOT pushed (unlike the old right panel). */}
      <div
        data-underlay-nav-screen
        className="underlay-nav__screen"
        aria-hidden="false"
      >
        {/* The blurred backdrop WIPES in left→right (GSAP animates a clip-path
            inset on these directly). NOTE: they must NOT sit inside a
            transformed wrapper — a transformed ancestor becomes the backdrop
            root and kills backdrop-filter, losing the live blur. The blur is
            the "matches the changing background but a bit blurred" pane; the
            scrim keeps links legible; the mask keeps the right side crisp. */}
        <div className="underlay-nav__blur" />
        <div className="underlay-nav__scrim" />

        {/* Left-pinned primary links */}
        <nav
          data-underlay-nav-menu
          className="underlay-nav__menu"
          aria-label="Main navigation"
        >
          <ul className="underlay-nav__list">
            {NAV_LINKS.map(({ href, label, section, top, children }) => {
              const isActive = href === activeHref;
              // A child route being current pins its sub-link open (no hover
              // needed) — e.g. /origins under Our Story, /products under
              // Products.
              const activeChild = children?.some((c) => c.href === activeHref);
              return (
                <li
                  key={label}
                  data-reveal-l
                  className={`underlay-nav__item${children ? " has--sub" : ""}${activeChild ? " is--sub-active" : ""}`}
                >
                  <Link
                    href={href}
                    className={`underlay-nav__link-large${isActive ? " is--current" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    {...(section ? { "data-section-link": section } : {})}
                    {...(top ? { "data-home-link": "" } : {})}
                  >
                    <span className="underlay-nav__link-label">{label}</span>
                  </Link>
                  {children && (
                    <ul className="underlay-nav__sublist">
                      {children.map((child) => {
                        const childActive = child.href === activeHref;
                        return (
                          <li key={child.label}>
                            <Link
                              href={child.href}
                              className={`underlay-nav__sublink${childActive ? " is--current" : ""}`}
                              aria-current={childActive ? "page" : undefined}
                            >
                              {/* Elbow connector drawn from the parent link */}
                              <span
                                className="underlay-nav__sub-elbow"
                                aria-hidden="true"
                              />
                              <span className="underlay-nav__sublink-label">
                                {child.label}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

    </div>
  );
}
