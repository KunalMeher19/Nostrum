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
          viewBox="0 0 730 1000"
          aria-hidden="true"
        >
          {/* Ends of the coastline dissolve into the dark, like the
              client's reference — gradient runs along the NE→SW diagonal. */}
          <defs>
            <linearGradient
              id="origin-map-coast-fade"
              gradientUnits="userSpaceOnUse"
              x1="712"
              y1="25"
              x2="18"
              y2="975"
            >
              <stop offset="0" stopColor="#e6b422" stopOpacity="0" />
              <stop offset="0.1" stopColor="#e6b422" stopOpacity="1" />
              <stop offset="0.9" stopColor="#e6b422" stopOpacity="1" />
              <stop offset="1" stopColor="#e6b422" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Catalan coast traced 1:1 from the client's reference artwork
              (feedback 2.0, scripts/trace-coast.mjs): NE tail → notched
              coast → the hooked spit → the promontory → the EBRE DELTA as
              two leaf-shaped lobes → faded SW tail. One continuous stroke;
              pathLength=1 so the draw is a simple 1→0 dashoffset. */}
          <path
            className="origin-map__coast"
            pathLength={1}
            d="M712 25.5 L 660.6 65.6 L 585.5 133 L 559.1 140.9 L 537.1 157.5
               L 522.9 179.2 L 532.6 185.7 L 532.5 189.2 L 512.3 194.3 L 518.7 201.9
               L 515.6 214.5 L 513 217.2 L 480.8 219.5 L 472.5 224.6 L 448.6 256.9
               L 428.3 272.8 L 428.8 293.6 L 420.4 301.1 L 408.4 306.3 L 405.9 311
               L 406.2 318 L 389 334.1 L 386.6 346.3 L 380.6 351.2 L 378.1 362.7
               L 369.5 365.2 L 321.6 404.2 L 310.5 418.1 L 299.7 441.1 L 285.7 449.5
               L 282.4 449.2 L 268.2 459.9 L 268.1 480.7 L 285.7 491.3 L 291.4 496.6
               L 291.1 499.9 L 301.9 508.5 L 315.8 513.9 L 337.1 514.2 L 341.9 509.3
               L 341.7 505.3 L 327.8 494.1 L 319 494.3 L 308.1 488.5 L 292.8 486.6
               L 291.1 479.9 L 293.6 477.2 L 320.6 474.1 L 339 480 L 344.7 485.4
               L 346.8 492 L 352.9 496.9 L 355.4 505.9 L 363.9 519.5 L 379.1 535.1
               L 383.5 544.7 L 391.6 553.3 L 407.8 561.8 L 416.7 555.5 L 431.7 555.4
               L 433.8 564.6 L 442.6 571.8 L 442.2 579.4 L 444.6 587.5 L 448.8 591.2
               L 448.6 595.6 L 433.9 597.7 L 434.5 607.4 L 431.5 615.2 L 411.8 634.4
               L 380.4 650.8 L 377.6 653.1 L 376.1 660.6 L 355.3 664.9 L 345.1 673.9
               L 338 675.7 L 336.1 679.1 L 324.4 684.3 L 311.6 699.2 L 305.1 701.3
               L 269.1 766.3 L 260.1 773.9 L 252.2 788.5 L 237.6 790.9 L 235.3 794
               L 205.3 805.4 L 176 805.2 L 164.6 797.2 L 156.6 785.6 L 155.8 770.4
               L 168.4 766.1 L 178.8 754.5 L 200 757.9 L 222.7 748.4 L 264 749.4
               L 276.5 734.1 L 283 729.6 L 291.3 715.6 L 291.1 712.4 L 302.6 693.5
               L 299.7 687.3 L 251 692.4 L 233.1 704.4 L 195.4 709.7 L 180.6 716.7
               L 167.2 715 L 151 726.5 L 142.6 737.6 L 146.2 752.4 L 125.8 757.3
               L 100.3 784.7 L 100.3 789 L 107.8 795.3 L 100.3 799.2 L 99.8 803
               L 106.5 808.2 L 88.9 813.1 L 83.4 818 L 70.1 858.6 L 55.8 880.6
               L 56 883.6 L 52.9 885.9 L 36.2 919.8 L 18 974.5"
            fill="none"
            stroke="url(#origin-map-coast-fade)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* The factory — on the Ebre, just NW of the delta (client's pin).
              Bloom + rings via CSS. */}
          <g className="origin-map__marker" transform="translate(340, 650)">
            <circle className="origin-map__marker-ring" r="16" />
            <circle className="origin-map__marker-ring origin-map__marker-ring--late" r="16" />
            <circle className="origin-map__marker-dot" r="5" />
          </g>

          {/* Esbozo annotation — same hand as the StoryScenes callouts. */}
          <g className="origin-map__note">
            <path
              className="origin-map__note-line"
              pathLength={1}
              d="M490 596 C 448 608, 402 622, 366 640"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              className="origin-map__note-head"
              pathLength={1}
              d="M379 628 L 366 640 L 384 645"
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
