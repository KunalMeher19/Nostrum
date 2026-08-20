"use client";

import { useEffect, useRef } from "react";
import "./site-footer.css";
import { getLenis, onLenis } from "../SmoothScroll/lenisStore";
import PressureWordmark from "./PressureWordmark";
import { useLocale } from "../LocaleContext/LocaleContext";
import { LocaleLink } from "../LocaleContext/LocaleLink";
import { showLegalModal } from "../LegalModal/LegalModal";
import type { LegalLocale } from "@/lib/legal-content";

/* ------------------------------------------------------------------ */
/* SiteFooter — sits below the light Shop and drives --page-t back to  */
/* 0 (dark) as you scroll into it, mirroring the Shop's 0→1 flip.     */
/* Same hysteresis ScrollTrigger, same shared --page-t + --nav-col.   */
/* ------------------------------------------------------------------ */

// Labels are i18n keys resolved via t() at render.
// Track-order is intentionally absent: order tracking lives inside the
// authenticated customer account only (client brief, item 4).
const NAV_LINKS = [
  { href: "/", labelKey: "footer.home" },
  { href: "/products", labelKey: "footer.shop" },
  { href: "/origins", labelKey: "footer.history" },
  { href: "/journal", labelKey: "footer.journal" },
  { href: "/contact", labelKey: "footer.contact" },
];

// No social media accounts.

export default function SiteFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { t, locale } = useLocale();

  // Mirror of ProductsSection's theme flip — but reversed: drives --page-t
  // back to 0 (dark) as you scroll into the footer, so the whole viewport
  // (Shop tail + footer) returns to dark together with no seam.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const root = document.documentElement;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    let unsubLenis = () => {};
    let detachScroll = () => {};

    const WHITE: [number, number, number] = [245, 245, 243];
    const GOLD: [number, number, number] = [230, 180, 34];
    const INK: [number, number, number] = [20, 22, 15];
    const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * k);
    const mix = (a: [number, number, number], b: [number, number, number], k: number) =>
      `rgb(${lerp(a[0], b[0], k)}, ${lerp(a[1], b[1], k)}, ${lerp(a[2], b[2], k)})`;
    const navColour = (t: number) =>
      t <= 0.5 ? mix(WHITE, GOLD, t * 2) : mix(GOLD, INK, (t - 0.5) * 2);

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.gsap ?? gsapMod.default;
      gsap.registerPlugin(ScrollTrigger);

      // ---- Back-to-top button hover ----------------------------------------
      const btn = btnRef.current;
      if (btn && !prefersReduced) {
        const arrow = btn.querySelector<SVGElement>(".nf__top-arrow");
        const tl = gsap
          .timeline({ paused: true, defaults: { ease: "power3.out" } })
          .to(arrow, { y: -5, duration: 0.4 });
        const enter = () => tl.play();
        const leave = () => tl.reverse();
        btn.addEventListener("mouseenter", enter);
        btn.addEventListener("mouseleave", leave);
      }

      unsubLenis = onLenis((lenis) => {
        const onScroll = () => ScrollTrigger.update();
        lenis.on("scroll", onScroll);
        detachScroll = () => lenis.off("scroll", onScroll);
      });

      ctx = gsap.context(() => {
        // Same hysteresis thresholds as the Shop — enter dark at ≥90% visible,
        // exit dark (back to light) at ≤45% visible on the way up.
        const ENTER_DARK = 0.9;
        const EXIT_DARK = 0.45;

        const themeState = { t: 1 }; // starts at 1 (light, seamless with Shop)
        let dark = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let flip: any = null;

        const applyTheme = () => {
          const t = themeState.t;
          root.style.setProperty("--page-t", t.toFixed(4));
          root.style.setProperty("--nav-col", navColour(t));
        };

        const flipTo = (target: number) => {
          flip?.kill();
          flip = gsap.to(themeState, {
            t: target,
            duration: prefersReduced ? 0 : 0.8,
            ease: "power2.inOut",
            onUpdate: applyTheme,
            overwrite: true,
          });
        };

        const evaluate = (vf: number) => {
          if (!dark && vf >= ENTER_DARK) { dark = true;  flipTo(0); }
          else if (dark && vf <= EXIT_DARK) { dark = false; flipTo(1); }
        };

        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "top top",
          onRefresh: (self) => evaluate(self.progress),
          onUpdate: (self) => evaluate(self.progress),
        });

        ScrollTrigger.refresh();
      }, section);
    })();

    return () => {
      cancelled = true;
      unsubLenis();
      detachScroll();
      ctx?.revert();
    };
  }, []);

  // Lenis owns the scroll — go through it so the ride back up uses the same
  // smooth easing as the rest of the site (falls back to native smooth).
  const scrollTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer ref={sectionRef} className="nf" aria-label="Site footer">
      {/* ── Head row: tagline + back-to-top ── */}
      <div className="nf__head">
        <p className="nf__tagline">{t("footer.tagline")}</p>
        <button
          ref={btnRef}
          className="nf__top-btn"
          aria-label={t("footer.back_to_top")}
          onClick={scrollTop}
        >
          <svg
            className="nf__top-arrow"
            viewBox="0 0 19 22"
            width="19"
            height="22"
            aria-hidden="true"
          >
            <path d="M8.607 3.203 1.198 10.417 0 9.229 9.5 0 19 9.229l-1.198 1.209-7.408-7.235V22H8.629V3.203h-.022Z" />
          </svg>
        </button>
      </div>

      {/* ── Body: address · nav ── */}
      <div className="nf__body">
        <div className="nf__col">
          <h4 className="nf__col-title">Nostrum</h4>
          <address className="nf__address">
            El Perelló, Catalonia
            <br />
            Spain, EU
          </address>
          <ul className="nf__contact">
            <li>
              <a href="mailto:office@nostrumoils.com">office@nostrumoils.com</a>
            </li>
            <li>
              <a href="mailto:sales@nostrumoils.com">sales@nostrumoils.com</a>
            </li>
            <li>
              <a href="tel:+34680889399">+34 680 889 399</a>
            </li>
            <li>
              <a
                href="https://wa.me/34680889399"
                target="_blank"
                rel="noopener noreferrer"
                className="nf__wa"
              >
                WhatsApp
                <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                  <path
                    d="M2 10 10 2M4 2h6v6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        <nav className="nf__col" aria-label="Footer navigation">
          <h4 className="nf__col-title">{t("footer.navigation")}</h4>
          <ul className="nf__nav">
            {NAV_LINKS.map(({ href, labelKey }) => (
              <li key={href}>
                <LocaleLink href={href}>{t(labelKey)}</LocaleLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* ── Poster wordmark — cursor-pressure variable type ── */}
      <PressureWordmark text="NOSTRUM" />

      {/* ── Legal row ── */}
      <div className="nf__legal">
        <span className="nf__origin">
          ©{new Date().getFullYear()} Nostrum
          <span className="nf__origin-dot" aria-hidden="true" />
          {t("footer.origin")}
        </span>
        <ul className="nf__gdpr">
          <li>
            <button
              onClick={() => showLegalModal("privacy", locale as LegalLocale)}
              className="nf__legal-link"
              type="button"
            >
              {t("footer.privacy")}
            </button>
          </li>
          <li>
            <button
              onClick={() => showLegalModal("cookies", locale as LegalLocale)}
              className="nf__legal-link"
              type="button"
            >
              {t("footer.cookies")}
            </button>
          </li>
          <li>
            <button
              onClick={() => showLegalModal("legal", locale as LegalLocale)}
              className="nf__legal-link"
              type="button"
            >
              {t("footer.legal")}
            </button>
          </li>
          <li>
            <button
              onClick={() => showLegalModal("terms", locale as LegalLocale)}
              className="nf__legal-link"
              type="button"
            >
              {t("footer.terms")}
            </button>
          </li>
        </ul>
      </div>
    </footer>
  );
}
