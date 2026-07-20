"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  hasClientNavigated,
  CURTAIN_REVEAL_EVENT,
} from "../RouteCurtain/curtainNav";
import "./story-scenes.css";

/* ------------------------------------------------------------------ */
/* StoryScenes                                                         */
/*                                                                     */
/* The cinematic scroll-story that opens /origins, before the          */
/* "How it is made" timeline. Mechanic inspired by                     */
/* scrollytelling.explanideo.de: a full-viewport stage is PINNED while  */
/* you scroll; the background scene stays fixed and each beat's photo   */
/* slowly scales + drifts (Ken Burns) as its caption crossfades in.     */
/* Rebuilt for Nostrum's world — dark ink canvas, gold light, real      */
/* photography (§6) instead of the reference's watercolor look.         */
/*                                                                      */
/* Distinct image per scene (client's call). Three beats: the land →    */
/* the family → the harvest, which flows straight into the timeline.    */
/*                                                                      */
/* Motion: one pinned ScrollTrigger scrubbed to Lenis (global). A       */
/* single `progress` (0→1) drives every scene's opacity/scale via a     */
/* per-scene window, so there is exactly one scrubbed tween — cheap and */
/* seam-free. prefers-reduced-motion renders a plain stacked fallback,  */
/* no pin, no scrub. Conventions match StoryProcess (dynamic gsap       */
/* import, gsap.context revert, refreshPriority below the hero pin).    */
/* ------------------------------------------------------------------ */

type Callout = {
  label: string;
  /* Label + arrow anchors, % of the stage (photography is art-directed to
     keep these features roughly in place across cover-crops). */
  labelX: string;
  labelY: string;
  arrowX: string;
  arrowY: string;
  /* Arrow aim — rotation in deg, optional horizontal flip. */
  rotate: number;
  flip?: boolean;
  /* Draw-in stagger within the scene. */
  delay?: number;
};

type Scene = {
  eyebrow: string;
  title: string;
  copy: string;
  img: string;
  alt: string;
  callouts?: Callout[];
};

// Origin photography (client-supplied, 2026-07) + esbozo arrow annotations
// pointing out what the frame is really about — sketchy hand-drawn arrows for
// craft warmth (NOSTRUM-DESIGN motion ideas), gold ink, few words.
const SCENES: Scene[] = [
  {
    eyebrow: "The land",
    title: "Where it begins",
    copy: "A single grove on the Mediterranean coast. Old trees, patient soil, salt in the air.",
    img: "/images/origin_1.png",
    alt: "Ancient olive tree above the Mediterranean coast at golden hour",
    callouts: [
      {
        label: "two centuries old",
        labelX: "47%",
        labelY: "36%",
        arrowX: "56%",
        arrowY: "42%",
        rotate: 32,
        delay: 0,
      },
      {
        label: "salt in the air",
        labelX: "20%",
        labelY: "18%",
        arrowX: "12%",
        arrowY: "23%",
        rotate: 148,
        flip: true,
        delay: 0.5,
      },
    ],
  },
  {
    eyebrow: "The family",
    title: "The same hands",
    copy: "Four generations, one grove. Nothing here is rushed, and nothing is left to chance.",
    img: "/images/origin_2.png",
    alt: "Weathered hands passing fresh olives to a younger hand",
    callouts: [
      {
        label: "grandfather's harvest",
        labelX: "50%",
        labelY: "20%",
        arrowX: "58%",
        arrowY: "25%",
        rotate: 38,
        delay: 0,
      },
      {
        label: "the next pair",
        labelX: "43%",
        labelY: "82%",
        arrowX: "50%",
        arrowY: "87%",
        rotate: 16,
        delay: 0.5,
      },
    ],
  },
  {
    eyebrow: "The harvest",
    title: "When the fruit decides",
    copy: "Picked at first light, at the peak of ripeness — then pressed the very same day.",
    img: "/images/origin_3.png",
    alt: "Olives pouring from a wooden harvest crate at sunrise",
    callouts: [
      {
        label: "crate by crate, by hand",
        labelX: "48%",
        labelY: "18%",
        arrowX: "56%",
        arrowY: "23%",
        rotate: 22,
        delay: 0,
      },
      {
        label: "hours from the press",
        labelX: "56%",
        labelY: "68%",
        arrowX: "63%",
        arrowY: "74%",
        rotate: 26,
        delay: 0.5,
      },
    ],
  },
];

/* Hand-drawn (esbozo) annotation arrow — a loose curved stroke + open head,
   drawn in via stroke-dashoffset when its scene becomes active. */
function SketchArrow({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      className="story-scenes__callout-arrow"
      viewBox="0 0 120 70"
      style={style}
      aria-hidden="true"
    >
      <path
        className="story-scenes__arrow-line"
        d="M6 12 C 34 2, 76 10, 104 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        className="story-scenes__arrow-head"
        d="M89 46 L 104 48 L 103 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StoryScenes() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // Reduced motion: leave the static stacked fallback (CSS shows all scenes).
    if (prefersReduced) {
      root.classList.remove("is--pre");
      root.classList.add("is--static");
      return;
    }

    /* ---- Entry choreography (the welcome) --------------------------- */
    // First scene opens with a slow settle: image eases down from a deeper
    // zoom, caption lines rise through a mask, arrows sketch themselves in
    // last. When we arrive from Home via the RouteCurtain, the whole thing
    // is held (is--pre) until the drape starts lifting, so the settle plays
    // AS the page is revealed — one continuous premium beat, not two.
    let entryTimer = 0;
    let entryDoneTimer = 0;
    const beginEntry = () => {
      window.removeEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      window.clearTimeout(entryTimer);
      root.classList.remove("is--pre");
      // Reflow so the pre→enter transition actually animates.
      void root.offsetWidth;
      root.classList.add("is--enter");
      // Once the choreography has fully played, shed the entry class so its
      // extra transition-delays don't slow later scroll-back arrow redraws.
      entryDoneTimer = window.setTimeout(
        () => root.classList.remove("is--enter"),
        4500
      );
    };

    root.classList.add("is--pre");
    if (hasClientNavigated()) {
      // Arriving from Home under the RouteCurtain: hold until the drape
      // starts lifting so the settle plays through the reveal.
      window.addEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      // Safety: if the reveal event never lands (curtain interrupted), enter anyway.
      entryTimer = window.setTimeout(beginEntry, 3500);
    } else {
      // Hard load: play the same settle right away (next frame, so the
      // staged pre-state has painted and the transition can run).
      entryTimer = window.setTimeout(beginEntry, 60);
    }

    const scenes = Array.from(
      root.querySelectorAll<HTMLElement>(".story-scenes__scene")
    );
    const dots = Array.from(
      root.querySelectorAll<HTMLElement>(".story-scenes__dot")
    );
    const n = scenes.length;
    if (!n) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;

    // Each scene owns a slice of the 0→1 progress. Within its slice it fades
    // up, holds, then fades out (except the last, which holds to the end).
    // clamp + smoothstep give soft, filmic crossfades rather than linear wipes.
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const smooth = (v: number) => v * v * (3 - 2 * v);

    const applyProgress = (p: number) => {
      const span = 1 / n;
      let active = 0;
      for (let i = 0; i < n; i++) {
        const start = i * span;
        const local = (p - start) / span; // 0→1 across this scene's slice
        // Fade in over the first 35%, fade out over the last 35% (last scene
        // never fades out). A held middle keeps the caption readable.
        // First scene opens fully visible (no fade-in from black at p=0);
        // last scene never fades out (holds until the pin releases).
        const fadeIn = i === 0 ? 1 : smooth(clamp01(local / 0.35));
        const fadeOut =
          i === n - 1 ? 1 : 1 - smooth(clamp01((local - 0.65) / 0.35));
        const vis = clamp01(Math.min(fadeIn, fadeOut));

        const scene = scenes[i];
        scene.style.opacity = `${vis}`;
        // Ken Burns: image scales 1.08→1.16 across its own life; caption rises.
        const img = scene.querySelector<HTMLElement>(".story-scenes__media");
        const cap = scene.querySelector<HTMLElement>(".story-scenes__caption");
        const lp = clamp01(local);
        if (img) img.style.transform = `scale(${1.08 + lp * 0.08})`;
        if (cap) cap.style.transform = `translateY(${(1 - fadeIn) * 40}px)`;
        scene.style.zIndex = `${vis > 0.02 ? 2 : 1}`;
        // Arrows/callouts sketch themselves in while their scene is on
        // screen, and reset when it leaves so they redraw on return.
        scene.classList.toggle("is--live", vis >= 0.45);
        if (vis >= 0.5) active = i;
      }
      dots.forEach((d, i) =>
        d.classList.toggle("is--active", i === active)
      );
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
        // The stage is pinned by NATIVE position:sticky (see CSS) — far more
        // robust with Lenis + transformed ancestors ([data-main]/RouteCurtain
        // carry transforms, which break ScrollTrigger's position:fixed pin).
        // ScrollTrigger here does nothing but report scroll progress across the
        // tall section; sticky handles the "stay in place" for free.
        ScrollTrigger.create({
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          invalidateOnRefresh: true,
          // Measured after any upstream pin — matches StoryProcess.
          refreshPriority: -1,
          onUpdate: (self: { progress: number }) => applyProgress(self.progress),
          onRefresh: (self: { progress: number }) => applyProgress(self.progress),
        });
      }, root);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      window.clearTimeout(entryTimer);
      window.clearTimeout(entryDoneTimer);
      ctx?.revert();
    };
  }, []);

  return (
    <section
      className="story-scenes"
      ref={rootRef}
      aria-label="The Nostrum story"
      style={{ "--scene-count": SCENES.length } as React.CSSProperties}
    >
      <div className="story-scenes__stage">
        {SCENES.map((s, i) => (
          <div
            className="story-scenes__scene"
            key={s.title}
            data-index={i}
            style={{ zIndex: i === 0 ? 2 : 1 }}
          >
            <div className="story-scenes__media">
              <Image
                className="story-scenes__image"
                src={s.img}
                alt={s.alt}
                fill
                priority={i === 0}
                sizes="100vw"
              />
            </div>
            {/* Dark gradient scrim so caption text stays legible over photos */}
            <div className="story-scenes__scrim" aria-hidden="true" />

            {/* Hand-drawn annotations — arrow + a few words pointing into the
                photograph. Decorative; the copy below carries the meaning. */}
            {s.callouts?.map((c) => (
              <div
                className="story-scenes__callout"
                key={c.label}
                aria-hidden="true"
                style={
                  { "--callout-delay": `${c.delay ?? 0}s` } as React.CSSProperties
                }
              >
                <span
                  className="story-scenes__callout-label"
                  style={{ left: c.labelX, top: c.labelY }}
                >
                  {c.label}
                </span>
                <SketchArrow
                  style={{
                    left: c.arrowX,
                    top: c.arrowY,
                    transform: `translate(-50%, -50%) rotate(${c.rotate}deg)${
                      c.flip ? " scaleX(-1)" : ""
                    }`,
                  }}
                />
              </div>
            ))}

            <div className="story-scenes__caption">
              <p className="story-scenes__eyebrow">{s.eyebrow}</p>
              <h2 className="story-scenes__title">{s.title}</h2>
              <p className="story-scenes__copy">{s.copy}</p>
            </div>
          </div>
        ))}

        {/* Progress dots — which beat you're on */}
        <ul className="story-scenes__dots" aria-hidden="true">
          {SCENES.map((s, i) => (
            <li
              className={`story-scenes__dot${i === 0 ? " is--active" : ""}`}
              key={s.title}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
