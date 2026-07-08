"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "./lux-button.css";

/**
 * LuxButton — the universal Nostrum CTA.
 *
 * Editorial style (see NOSTRUM-DESIGN §9/§10): an uppercase label above a
 * gold rule. On hover the label mask-swaps (current copy slides up, a gold
 * duplicate rises into place) while the gold underline draws left→right and
 * the trailing arrow nudges right. GSAP drives the motion so the timing
 * matches the rest of the site (--ease-lux); CSS defines the resting geometry
 * so it looks correct before hydration and under reduced-motion.
 *
 * Renders a Next.js <Link> when `href` is set, otherwise a <button>. Pass
 * `onClick` for button behaviour (e.g. the "View our story" CTA, which does
 * not route anywhere yet).
 */
type LuxButtonProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  arrow?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function LuxButton({
  label,
  href,
  onClick,
  arrow = true,
  className = "",
  ariaLabel,
}: LuxButtonProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // CSS shows the static legible state; skip the GSAP hover.
    }

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    let cleanup: (() => void) | null = null;

    (async () => {
      const gsapMod = await import("gsap");
      if (cancelled) return;
      const gsap = gsapMod.gsap ?? gsapMod.default;

      const base = el.querySelector(".lux-btn__label-inner:not(.is--dup)");
      const dup = el.querySelector(".lux-btn__label-inner.is--dup");
      const fill = el.querySelector(".lux-btn__line-fill");
      const tick = el.querySelector(".lux-btn__line-tick");
      const arrowEl = el.querySelector(".lux-btn__arrow");

      ctx = gsap.context(() => {
        const ease = "power3.out";
        const duration = 0.55;

        // A single reversible timeline: play forward on enter, reverse on
        // leave. Reversing (rather than building a new tween) keeps rapid
        // hover on/off smooth and always lands back on the resting state.
        const tl = gsap.timeline({ paused: true });

        tl.to(base, { yPercent: -105, duration, ease }, 0)
          .to(dup, { yPercent: -105, duration, ease }, 0)
          .to(tick, { opacity: 0, duration: 0.2, ease: "none" }, 0)
          .fromTo(
            fill,
            { scaleX: 0 },
            { scaleX: 1, duration, ease },
            0
          );

        if (arrowEl) {
          tl.to(arrowEl, { x: 6, duration, ease }, 0);
        }

        const enter = () => tl.play();
        const leave = () => tl.reverse();

        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
        el.addEventListener("focus", enter);
        el.addEventListener("blur", leave);

        cleanup = () => {
          el.removeEventListener("mouseenter", enter);
          el.removeEventListener("mouseleave", leave);
          el.removeEventListener("focus", enter);
          el.removeEventListener("blur", leave);
        };
      }, el);
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
      if (ctx) ctx.revert();
    };
  }, []);

  const inner = (
    <>
      <span className="lux-btn__row">
        <span className="lux-btn__label">
          <span className="lux-btn__label-inner">{label}</span>
          <span className="lux-btn__label-inner is--dup" aria-hidden="true">
            {label}
          </span>
        </span>
        {arrow && (
          <span className="lux-btn__arrow" aria-hidden="true">
            →
          </span>
        )}
      </span>
      <span className="lux-btn__line" aria-hidden="true">
        <span className="lux-btn__line-tick" />
        <span className="lux-btn__line-fill" />
      </span>
    </>
  );

  const classes = `lux-btn ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel ?? label}
        ref={rootRef as React.Ref<HTMLAnchorElement>}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      ref={rootRef as React.Ref<HTMLButtonElement>}
    >
      {inner}
    </button>
  );
}
