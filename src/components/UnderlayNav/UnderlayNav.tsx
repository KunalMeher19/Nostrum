"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "./underlay-nav.css";

/* ── Navigation data ──────────────────────────────────────── */
const NAV_LINKS = [
  { href: "/", label: "Home", current: true },
  { href: "/story", label: "Our Story" },
  { href: "/products", label: "Products" },
  { href: "/origins", label: "Origins" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

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
        /* ── Element references ─────────────────────────────── */
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
        const smallItems =
          root.querySelectorAll<HTMLElement>("[data-reveal-s]");
        const menuBorder = root.querySelector<HTMLElement>(
          ".underlay-nav__bottom-border"
        );
        // [data-main] lives outside this component (in the page layout).
        const mainEl = document.querySelector<HTMLElement>("[data-main]")!;
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

        if (!toggleBtn || !menuEl || !mainEl || !overlayEl) return;

        // Capture the toggle button's colour in both states from the CSS so
        // we never hard-code colours in JS.
        const closedColor = getComputedStyle(toggleBtn).color;
        const openColor = getComputedStyle(menuEl).color;

        let isOpen = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let tl: any;
        let enterEndTime = 0;

        // Dynamically read menu width each time the timeline is invalidated so
        // the offset stays correct after viewport resize.
        const getMenuOffset = () => -menuEl.offsetWidth;

        /* ── Initial GSAP state (matches CSS defaults) ─────── */
        gsap.set(overlayEl, { visibility: "hidden", pointerEvents: "none" });
        gsap.set(darkEl, { autoAlpha: 0 });
        gsap.set(mainEl, { x: 0 });
        gsap.set(toggleLabels, { yPercent: 0 });
        gsap.set(toggleBars, { y: 0, rotation: 0 });
        gsap.set(menuBorder, { scaleX: 0 });
        gsap.set(overlayBorders[0], { yPercent: -100 });
        gsap.set(overlayBorders[1], { yPercent: 100 });
        gsap.set(corners, { scale: 0 });

        /* ── Build timeline ─────────────────────────────────── */
        // The timeline is built once with a pause between the ENTER sequence
        // and the EXIT sequence.  play() and reverse() navigate it.
        function buildTimeline() {
          tl = gsap.timeline({
            paused: true,
            defaults: { ease: "energy" },
          });

          // — ENTER (open) ——————————————————————————————————
          tl.set(overlayEl, { visibility: "visible", pointerEvents: "auto" }, 0)

            // Slide page + overlay left to expose the menu panel
            // (slower + softer expo curve for a smooth, luxurious open)
            .to(
              [mainEl, overlayEl],
              { x: getMenuOffset, duration: 1.15, ease: "expo.out" },
              0
            )

            // Dim the exposed page content
            .to(darkEl, { autoAlpha: 1, duration: 0.8 }, 0)

            // Decorative border corners scale in
            .to(corners, { scale: 1, duration: 0.8 }, 0)

            // Border rows slide in from top/bottom
            .to(overlayBorders, { yPercent: 0, duration: 0.8 }, 0)

            // "Menu" label scrolls up, revealing "Close" below it
            .to(toggleLabels, { yPercent: -100, duration: 0.5 }, 0)

            // Toggle button colour transitions to match the open menu's fg
            .to(toggleBtn, { color: openColor, duration: 0.5 }, 0)

            // Hamburger bars cross to form an ✕
            .to(
              toggleBars[0],
              { y: "0.25em", rotation: 45, duration: 0.35, ease: "back.out(1.4)" },
              0.05
            )
            .to(
              toggleBars[1],
              { y: "-0.25em", rotation: -45, duration: 0.35, ease: "back.out(1.4)" },
              0.05
            )

            // Large nav items slide in from the right
            // (much slower + longer stagger + soft expo curve — the links
            //  should unfurl gently, one after another)
            .fromTo(
              largeItems,
              { autoAlpha: 0, xPercent: 25 },
              {
                autoAlpha: 1,
                xPercent: 0,
                duration: 1.25,
                stagger: 0.11,
                ease: "expo.out",
              },
              0.15
            )

            // Small bottom items rise up
            .fromTo(
              smallItems,
              { autoAlpha: 0, yPercent: 100 },
              {
                autoAlpha: 1,
                yPercent: 0,
                duration: 0.9,
                stagger: 0.06,
                ease: "expo.out",
              },
              0.5
            )

            // Bottom border scales in from the left
            .to(menuBorder, { scaleX: 1, duration: 0.8 }, "<");

          // Mark where the ENTER sequence ends so toggle() knows the state.
          enterEndTime = tl.duration();

          // — PAUSE (the timeline waits here when open) ————————
          tl.addPause();

          // — EXIT (close) ————————————————————————————————————
          tl.to([largeItems, smallItems], { autoAlpha: 0, duration: 0.3 }, "<")
            .to([mainEl, overlayEl], { x: 0, duration: 0.6 }, "<")
            .to(
              darkEl,
              { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" },
              "<"
            )
            .to(corners, { scale: 0, duration: 0.5 }, "<")
            .to(overlayBorders[0], { yPercent: -100, duration: 0.5 }, "<")
            .to(overlayBorders[1], { yPercent: 100, duration: 0.5 }, "<")
            .to(toggleBtn, { color: closedColor, duration: 0.25 }, "<+=0.1")
            .to(
              toggleLabels,
              { yPercent: 0, duration: 0.25, ease: "power3.in" },
              "<"
            )
            .to(
              toggleBars,
              { y: 0, rotation: 0, duration: 0.25, ease: "power3.in" },
              "<"
            )
            // Hide and disable the overlay once fully closed
            .set(overlayEl, { visibility: "hidden", pointerEvents: "none" });
        }

        /* ── Toggle handler ─────────────────────────────────── */
        function toggle() {
          isOpen = !isOpen;
          toggleBtn.setAttribute("aria-expanded", String(isOpen));
          toggleBtn.setAttribute(
            "aria-label",
            isOpen ? "close menu" : "open menu"
          );
          // Let global CSS react to the open state if needed.
          document.body.setAttribute("data-menu-status", isOpen ? "open" : "");

          if (isOpen) {
            // invalidate() recalculates getMenuOffset() for fresh viewport sizes.
            tl.invalidate();
            if (tl.time() >= enterEndTime) tl.timeScale(1).restart();
            else tl.timeScale(1).play();
          } else {
            // If still mid-enter, reverse; otherwise play the exit sequence.
            if (tl.time() < enterEndTime) tl.timeScale(1).reverse();
            else tl.timeScale(1).play();
          }
        }

        buildTimeline();

        /* ── Event Listeners ────────────────────────────────── */
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
              gsap.set([mainEl, overlayEl], { x: getMenuOffset() });
            } else {
              // Let getMenuOffset re-evaluate on next open.
              tl.invalidate();
            }
          }, 150);
        };

        toggleBtn.addEventListener("click", toggle);
        overlayEl.addEventListener("click", handleOverlayClick);
        document.addEventListener("keydown", handleKeydown);
        window.addEventListener("resize", handleResize);

        // Return cleanup from gsap.context() — runs automatically on ctx.revert()
        return () => {
          toggleBtn.removeEventListener("click", toggle);
          overlayEl.removeEventListener("click", handleOverlayClick);
          document.removeEventListener("keydown", handleKeydown);
          window.removeEventListener("resize", handleResize);
          clearTimeout(resizeTimer);
          document.body.removeAttribute("data-menu-status");
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

      {/* ── Fixed header bar ─────────────────────────────────── */}
      <header className="underlay-nav__header">
        <div className="underlay-nav__bar">
          <div className="underlay-nav__container">
            <Link
              href="/"
              className="underlay-nav__logo"
              aria-label="Nostrum home"
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

      {/* ── Slide-in menu panel (fixed to right edge) ────────── */}
      <nav
        data-underlay-nav-menu
        className="underlay-nav__menu"
        aria-label="Main navigation"
      >
        <div className="underlay-nav__inner">

          {/* Primary links */}
          <ul className="underlay-nav__list">
            {NAV_LINKS.map(({ href, label, current }) => (
              <li key={label} data-reveal-l>
                <Link
                  href={href}
                  className={`underlay-nav__link-large${current ? " is--current" : ""}`}
                  aria-current={current ? "page" : undefined}
                >
                  <span className="underlay-nav__link-label">{label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Bottom section: socials + legal */}
          <div className="underlay-nav__bottom">
            <div className="underlay-nav__bottom-col">
              <div data-reveal-s>
                <span className="underlay-nav__link-small is--faded">
                  Socials
                </span>
              </div>
              <ul className="underlay-nav__list is--small">
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <li key={label} data-reveal-s>
                    <a href={href} className="underlay-nav__link-small">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="underlay-nav__bottom-col">
              <div data-reveal-s>
                <span className="underlay-nav__link-small is--faded">
                  Legal
                </span>
              </div>
              <ul className="underlay-nav__list is--small">
                <li data-reveal-s>
                  <a href="#" className="underlay-nav__link-small">
                    Privacy Policy ↗
                  </a>
                </li>
                <li data-reveal-s>
                  <a href="#" className="underlay-nav__link-small">
                    Terms &amp; Conditions ↗
                  </a>
                </li>
              </ul>
            </div>

            {/* Animated border line */}
            <div className="underlay-nav__bottom-border" />
          </div>
        </div>
      </nav>

      {/* ── Overlay: slides with page content and dims it ───── */}
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
