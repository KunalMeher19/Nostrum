"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./underlay-nav.css";
import { requestSectionScroll, requestScrollTop } from "../SmoothScroll/storyScroll";
import { onLenis } from "../SmoothScroll/lenisStore";

/* ---- Navigation data ---------------------------------------- */
// On the landing page "Home" and "Our Story" are in-page scroll targets, not
// routes: clicking smooth-scrolls (via Lenis) between the top hero and the
// Story section and the sidebar lights whichever you're in. "Home" + the
// NOSTRUM wordmark scroll back up to the hero. The remaining links are ordinary
// routes. `activeHref` (scroll-spy for landing sections, route match otherwise)
// drives the gold is--current highlight.
const NAV_LINKS = [
  { href: "/", label: "Home", top: true },
  { href: "/#story", label: "Our Story", section: "#story" },
  { href: "/#products", label: "Products", section: "#products" },
  { href: "/origins", label: "Origins" },
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
 * UnderlayNav — faithful port of the Osmo "underlay navigation" pattern.
 *
 * Structure (all children are position:fixed):
 *   header   – top bar with Nostrum wordmark + toggle button
 *   nav      – slide-in menu panel (right edge)
 *   overlay  – translucent overlay that slides LEFT with [data-main] and
 *              dims the exposed page content when the menu is open
 *
 * The page content element that should "push" left is identified by the
 * [data-main] attribute.  Add it to the <main> tag in the page component.
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
        // [data-main] lives outside this component (in the page layout) and is
        // SWAPPED on every client-side navigation while this nav stays mounted.
        // So it must be read live at each use — a reference captured once here
        // goes stale after the first route change (the old node detaches), which
        // left the incoming page unable to slide and the overlay stuck open.
        const getMain = () =>
          document.querySelector<HTMLElement>("[data-main]");
        const overlayEl = root.querySelector<HTMLElement>(
          "[data-underlay-nav-overlay]"
        )!;
        const darkEl = root.querySelector<HTMLElement>(
          ".underlay-nav__dark"
        );
        const corners =
          root.querySelectorAll<HTMLElement>(".underlay-nav__corner");
        const overlayBorders = root.querySelectorAll<HTMLElement>(
          ".underlay-nav__border-row"
        );

        if (!toggleBtn || !menuEl || !getMain() || !overlayEl) return;

        // Capture the toggle button's colour in both states from the CSS so
        // we never hard-code colours in JS.
        const closedColor = getComputedStyle(toggleBtn).color;
        const openColor = getComputedStyle(menuEl).color;

        let isOpen = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let tl: any;

        // Dynamically read menu width each time the timeline is invalidated so
        // the offset stays correct after viewport resize.
        const getMenuOffset = () => menuEl.offsetWidth;

        /* ---- Initial GSAP state (matches CSS defaults) ------- */
        gsap.set(overlayEl, { visibility: "hidden", pointerEvents: "none" });
        gsap.set(darkEl, { autoAlpha: 0 });
        gsap.set(getMain(), { x: 0 });
        gsap.set(toggleLabels, { yPercent: 0 });
        gsap.set(toggleBars, { y: 0, rotation: 0 });
        gsap.set(overlayBorders[0], { yPercent: -100 });
        gsap.set(overlayBorders[1], { yPercent: 100 });
        gsap.set(corners, { scale: 0 });

        /* ---- Direct (non-timeline) motions -------------------- */
        // The page-slide, dim, and toggle button are driven DIRECTLY on every
        // click — never through the reversible timeline.  A full-timeline
        // reverse back-loads whatever sits at position 0 (it plays last), which
        // made the page + button feel unresponsive on close.  Driving them
        // directly means they react instantly in BOTH directions.
        function slidePage(open: boolean) {
          // Read [data-main] live so the CURRENT page slides (see getMain note).
          const mainEl = getMain();
          gsap.to([mainEl, overlayEl].filter(Boolean), {
            x: open ? getMenuOffset() : 0,
            duration: open ? 1.15 : 0.9,
            ease: "expo.out", // fast at the start → instant felt response
            overwrite: "auto",
          });
          gsap.to(darkEl, {
            autoAlpha: open ? 1 : 0,
            duration: open ? 0.8 : 0.5,
            overwrite: "auto",
          });
        }

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
        // This timeline holds only the decorative / staggered reveals (corners,
        // borders, nav links).  Opening plays it forward; closing REVERSES it,
        // so those elements unfurl and fold away as an exact mirror.
        function buildTimeline() {
          tl = gsap.timeline({
            paused: true,
            defaults: { ease: "energy" },
            // Once fully reversed (closed), hide + disable the overlay so it
            // stops intercepting clicks on the page beneath it.
            onReverseComplete: () => {
              gsap.set(overlayEl, {
                visibility: "hidden",
                pointerEvents: "none",
              });
            },
          });

          // Decorative border corners scale in
          tl.to(corners, { scale: 1, duration: 0.8 }, 0)

            // Border rows slide in from top/bottom
            .to(overlayBorders, { yPercent: 0, duration: 0.8 }, 0)

            // Large nav items slide in from the right
            // (much slower + longer stagger + soft expo curve — the links
            //  should unfurl gently, one after another)
            .fromTo(
              largeItems,
              { autoAlpha: 0, xPercent: -25 },
              {
                autoAlpha: 1,
                xPercent: 0,
                duration: 1.25,
                stagger: 0.11,
                ease: "expo.out",
              },
              0.15
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

          // The toggle button + page slide are driven directly so they react
          // instantly on every click, regardless of open/close direction.
          animateToggleButton(isOpen);

          if (isOpen) {
            // Reveal the overlay before it starts sliding in.
            gsap.set(overlayEl, {
              visibility: "visible",
              pointerEvents: "auto",
            });
            slidePage(true);
            tl.timeScale(1).play();
          } else {
            // Stop intercepting clicks right away; visibility is cleared once
            // the reverse fully completes (onReverseComplete).
            gsap.set(overlayEl, { pointerEvents: "none" });
            slidePage(false);
            // Reverse the timeline so the decorative reveals mirror the open.
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
          gsap.set([getMain(), overlayEl].filter(Boolean), { x: 0 });
          gsap.set(darkEl, { autoAlpha: 0 });
          gsap.set(overlayEl, { visibility: "hidden", pointerEvents: "none" });
          tl.pause(0); // rewind the decorative reveal timeline to closed
        }
        closeMenuRef.current = forceClose;

        buildTimeline();

        /* ---- Event Listeners ---------------------------------- */
        const handleOverlayClick = () => { if (isOpen) toggle(); };
        const handleKeydown = (e: KeyboardEvent) => {
          if (e.key === "Escape" && isOpen) {
            toggle();
            toggleBtn.focus();
          }
        };
        let resizeTimer: ReturnType<typeof setTimeout>;
        const handleResize = () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (isOpen) {
              // Snap the x position to the updated menu width immediately.
              gsap.set([getMain(), overlayEl].filter(Boolean), {
                x: getMenuOffset(),
              });
            } else {
              // Let getMenuOffset re-evaluate on next open.
              tl.invalidate();
            }
          }, 150);
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
        overlayEl.addEventListener("click", handleOverlayClick);
        sectionLinks.forEach((el) =>
          el.addEventListener("click", handleSectionClick)
        );
        homeLinks.forEach((el) => el.addEventListener("click", handleHomeClick));
        document.addEventListener("keydown", handleKeydown);
        window.addEventListener("resize", handleResize);

        // Return cleanup from gsap.context() — runs automatically on ctx.revert()
        return () => {
          toggleBtn.removeEventListener("click", toggle);
          overlayEl.removeEventListener("click", handleOverlayClick);
          sectionLinks.forEach((el) =>
            el.removeEventListener("click", handleSectionClick)
          );
          homeLinks.forEach((el) =>
            el.removeEventListener("click", handleHomeClick)
          );
          document.removeEventListener("keydown", handleKeydown);
          window.removeEventListener("resize", handleResize);
          clearTimeout(resizeTimer);
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
          </div>
        </div>
      </header>

      {/* ---- Slide-in menu panel (fixed to right edge) ---------- */}
      <nav
        data-underlay-nav-menu
        className="underlay-nav__menu"
        aria-label="Main navigation"
      >
        <div className="underlay-nav__inner">

          {/* Primary links */}
          <ul className="underlay-nav__list">
            {NAV_LINKS.map(({ href, label, section, top }) => {
              const isActive = href === activeHref;
              return (
                <li key={label} data-reveal-l>
                  <Link
                    href={href}
                    className={`underlay-nav__link-large${isActive ? " is--current" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    {...(section ? { "data-section-link": section } : {})}
                    {...(top ? { "data-home-link": "" } : {})}
                  >
                    <span className="underlay-nav__link-label">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

        </div>
      </nav>

      {/* ---- Overlay: slides with page content and dims it ----- */}
      <div data-underlay-nav-overlay="" className="underlay-nav__overlay">
        {/* Semi-transparent dark film over the exposed page */}
        <div className="underlay-nav__dark" />

        {/* Decorative top + bottom border rows with rounded-corner trick */}
        <div className="underlay-nav__borders">
          <div className="underlay-nav__border-row">
            <div className="underlay-nav__border" />
            <div className="underlay-nav__corner" />
          </div>
          <div className="underlay-nav__border-row">
            <div className="underlay-nav__corner is--bottom" />
            <div className="underlay-nav__border" />
          </div>
        </div>
      </div>

    </div>
  );
}
