"use client";

import { useEffect, useRef } from "react";
import "./origin-numbers.css";

/* ------------------------------------------------------------------ */
/* OriginNumbers                                                       */
/*                                                                     */
/* "The numbers" — four stats in poster type that count up as the      */
/* section scrolls into view. Proof beat between the family's voice    */
/* and the map on /origins. Poster-scale figures, tiny labels — few    */
/* words, big type (§4).                                               */
/*                                                                     */
/* Motion: one ScrollTrigger (play once on enter) tweens a 0→1 that    */
/* eases each figure from 0 to its value with a stagger; prefix/suffix */
/* glyphs (Est. / < / h) don't count, only the digits roll.            */
/* Reduced motion: final values rendered, no count.                    */
/* ------------------------------------------------------------------ */

type Stat = {
  /* The number that counts up. */
  value: number;
  /* Rendered around the rolling digits. */
  prefix?: string;
  suffix?: string;
  /* Grouping separator for 4-digit values ("2,400"). */
  group?: boolean;
  label: string;
};

// ⚠ PLACEHOLDER FIGURES — plausible, on-voice, but NOT confirmed by the
// client. Flag for review before launch: founding year, tree count and
// the harvest-to-press window need the family's real numbers.
const STATS: Stat[] = [
  { value: 1923, prefix: "Est. ", label: "the founding year" },
  { value: 2400, group: true, label: "olive trees in the grove" },
  { value: 24, prefix: "<", suffix: "h", label: "from tree to press" },
  { value: 4, label: "generations, one family" },
];

export default function OriginNumbers() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      root.classList.add("is--static");
      return;
    }

    const items = Array.from(
      root.querySelectorAll<HTMLElement>(".origin-numbers__item")
    );
    const figures = Array.from(
      root.querySelectorAll<HTMLElement>(".origin-numbers__digits")
    );
    if (!figures.length) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;

    const fmt = (v: number, group?: boolean) =>
      group ? v.toLocaleString("en-US") : `${v}`;

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top 72%",
            // Play once forward; reverse when scrolled back above so a
            // revisit re-runs the count (matches StoryProcess reveals).
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
            refreshPriority: -1,
          },
          defaults: { ease: "power3.out" },
        });

        items.forEach((item, i) => {
          tl.fromTo(
            item,
            { autoAlpha: 0, y: 44 },
            { autoAlpha: 1, y: 0, duration: 0.9 },
            i * 0.14
          );
        });

        figures.forEach((fig, i) => {
          const stat = STATS[i];
          if (!stat) return;
          const counter = { v: 0 };
          tl.to(
            counter,
            {
              v: stat.value,
              duration: 1.6,
              ease: "power2.out",
              onUpdate: () => {
                fig.textContent = fmt(Math.round(counter.v), stat.group);
              },
            },
            0.2 + i * 0.14
          );
        });
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      className="origin-numbers"
      ref={rootRef}
      aria-label="The grove in numbers"
    >
      <p className="origin-numbers__eyebrow">The grove in numbers</p>
      <dl className="origin-numbers__grid">
        {STATS.map((s) => (
          <div className="origin-numbers__item" key={s.label}>
            <dt className="origin-numbers__label">{s.label}</dt>
            <dd className="origin-numbers__figure">
              {s.prefix ? (
                <span className="origin-numbers__affix">{s.prefix}</span>
              ) : null}
              {/* Digits roll from 0 in JS; SSR/no-JS shows the real value. */}
              <span className="origin-numbers__digits">
                {s.group ? s.value.toLocaleString("en-US") : s.value}
              </span>
              {s.suffix ? (
                <span className="origin-numbers__affix">{s.suffix}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
