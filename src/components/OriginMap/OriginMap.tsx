"use client";

import { useEffect, useRef } from "react";
import "./origin-map.css";
import { useLocale } from "../LocaleContext/LocaleContext";

/* ------------------------------------------------------------------ */
/* OriginMap                                                           */
/*                                                                     */
/* The place beat on /origins — a minimal hand-drawn Catalonia          */
/* coastline in gold ink on deep olive, one pulsing marker at the      */
/* grove, and an esbozo arrow annotation in the same language as the   */
/* StoryScenes callouts ("here — nowhere else").                       */
/*                                                                     */
/* Motion: the coastline draws itself (stroke-dashoffset) on a short   */
/* scrub as the section enters; the marker blooms and the annotation   */
/* sketches in once the line has passed the grove. Reduced motion:     */
/* everything simply drawn.                                            */
/*                                                                     */
/* Geography is stylised, not cartographic: Cap de Creus → Costa       */
/* Brava → Barcelona → Tarragona → the Ebre delta. The marker sits     */
/* by the delta (Baix Ebre). Region + label are placeholder-approved   */
/* (2026-07): Catalonia, pending the client's exact town.              */
/* ------------------------------------------------------------------ */

export default function OriginMap() {
  const rootRef = useRef<HTMLElement | null>(null);
  const { t } = useLocale();

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

    const coast = root.querySelector<SVGPathElement>(".origin-map__coast");
    if (!coast) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

    const applyProgress = (p: number) => {
      // Coast draws over the first 70% of the travel…
      coast.style.strokeDashoffset = `${1 - clamp01(p / 0.7)}`;
      // …the marker blooms + annotation sketches once the ink reaches the
      // delta (class-driven CSS transitions, same as the scene callouts).
      root.classList.toggle("is--marked", p >= 0.62);
      // Headline/eyebrow ride the same scrub, early.
      const head = clamp01(p / 0.35);
      const headEls = root.querySelectorAll<HTMLElement>(
        ".origin-map__eyebrow, .origin-map__title"
      );
      headEls.forEach((el, i) => {
        const local = clamp01(head * 1.4 - i * 0.25);
        el.style.opacity = `${local}`;
        el.style.transform = `translateY(${(1 - local) * 26}px)`;
      });
    };

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;

      applyProgress(0);

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: root,
          start: "top 75%",
          end: "center 42%",
          scrub: true,
          invalidateOnRefresh: true,
          refreshPriority: -1,
          onUpdate: (self: { progress: number }) =>
            applyProgress(self.progress),
          onRefresh: (self: { progress: number }) =>
            applyProgress(self.progress),
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
      className="origin-map"
      ref={rootRef}
      aria-label={t("map.aria")}
    >
      <div className="origin-map__head">
        <p className="origin-map__eyebrow">{t("map.eyebrow")}</p>
        <h2 className="origin-map__title">{t("map.title")}</h2>
      </div>

      <div className="origin-map__stage">
        <svg
          className="origin-map__svg"
          viewBox="0 0 640 520"
          aria-hidden="true"
        >
          {/* Stylised Catalan coast, NE (Cap de Creus) → SW past the EBRE
              DELTA — the arrow-shaped lobe that pushes out into the sea
              (client feedback 1.0: represent the delta accurately; the
              factory sits on the river just NW of it, marked below).
              pathLength=1 so the draw is a simple 1→0 dashoffset. */}
          <path
            className="origin-map__coast"
            pathLength={1}
            d="M598 38
               C 586 52, 596 62, 584 66
               C 566 72, 574 88, 560 92
               C 544 97, 552 112, 538 118
               C 520 126, 526 140, 512 148
               C 494 158, 486 176, 470 188
               C 452 201, 440 214, 424 224
               C 404 237, 392 252, 374 262
               C 354 273, 344 288, 326 298
               C 306 309, 296 322, 278 332
               C 262 341, 252 354, 240 360
               C 254 362, 286 366, 312 380
               C 330 390, 342 400, 336 408
               C 330 416, 314 420, 296 426
               C 276 432, 252 430, 236 420
               C 228 415, 220 412, 208 414
               C 190 417, 178 422, 166 432
               C 154 442, 140 446, 126 450"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* The factory — on the Ebre, just NW of the delta (client's pin).
              Bloom + rings via CSS. */}
          <g className="origin-map__marker" transform="translate(206, 392)">
            <circle className="origin-map__marker-ring" r="16" />
            <circle className="origin-map__marker-ring origin-map__marker-ring--late" r="16" />
            <circle className="origin-map__marker-dot" r="5" />
          </g>

          {/* Esbozo annotation — same hand as the StoryScenes callouts. */}
          <g className="origin-map__note">
            <path
              className="origin-map__note-line"
              pathLength={1}
              d="M350 322 C 312 330, 262 352, 232 380"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              className="origin-map__note-head"
              pathLength={1}
              d="M246 366 L 232 380 L 250 384"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>

        {/* Label lives in HTML (not SVG text) for crisp type + easy i18n. */}
        <p className="origin-map__label">
          {t("map.label1")}
          <br />
          {t("map.label2")}
        </p>
        <p className="origin-map__sea">{t("map.sea")}</p>
      </div>
    </section>
  );
}
