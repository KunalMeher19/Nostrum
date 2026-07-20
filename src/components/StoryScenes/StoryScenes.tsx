"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  hasClientNavigated,
  CURTAIN_REVEAL_EVENT,
} from "../RouteCurtain/curtainNav";
import { getLenis } from "../SmoothScroll/lenisStore";
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
function SketchArrow({ style }: { style: React.CSSProperties }) {  return (
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

    /* ---- Golden dust atmosphere ------------------------------------ */
    // ~30 soft gold motes drifting slowly upward over the pinned stage —
    // the Home light-streak signature carried here as atmosphere. 2D canvas,
    // DPR-capped, and only running while the stage is actually on screen
    // (IntersectionObserver gates the rAF loop). Skipped under reduced
    // motion (we returned above).
    const dustCanvas = root.querySelector<HTMLCanvasElement>(
      ".story-scenes__dust"
    );
    let dustRaf = 0;
    let dustOn = false;
    let dustObserver: IntersectionObserver | null = null;

    if (dustCanvas) {
      const dctx = dustCanvas.getContext("2d");
      type Mote = {
        x: number; // 0..1 of width
        y: number; // 0..1 of height
        r: number; // radius px
        a: number; // base alpha
        vy: number; // upward drift, fraction of height / s
        vx: number; // sideways sway amplitude
        ph: number; // sway phase
        tw: number; // twinkle speed
      };
      // Deterministic-ish spread via golden-ratio scatter — no layout thrash,
      // stable across re-mounts.
      const MOTES: Mote[] = Array.from({ length: 30 }, (_, i) => {
        const g = (i * 0.618034) % 1;
        const h = (i * 0.754878) % 1;
        return {
          x: g,
          y: h,
          r: 0.8 + ((i * 7) % 10) * 0.22,
          a: 0.12 + ((i * 13) % 10) * 0.02,
          vy: 0.006 + ((i * 11) % 10) * 0.0012,
          vx: 0.004 + ((i * 5) % 10) * 0.0009,
          ph: g * Math.PI * 2,
          tw: 0.3 + ((i * 3) % 10) * 0.08,
        };
      });

      const sizeDust = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        dustCanvas.width = Math.round(dustCanvas.offsetWidth * dpr);
        dustCanvas.height = Math.round(dustCanvas.offsetHeight * dpr);
      };
      sizeDust();

      let last = performance.now();
      const tick = (now: number) => {
        if (!dustOn || !dctx) return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const W = dustCanvas.width;
        const H = dustCanvas.height;
        dctx.clearRect(0, 0, W, H);
        const t = now / 1000;
        for (const m of MOTES) {
          m.y -= m.vy * dt;
          if (m.y < -0.02) {
            m.y = 1.02;
            m.x = Math.random();
          }
          const sway = Math.sin(t * 0.6 + m.ph) * m.vx;
          // Slow twinkle so motes breathe instead of blinking.
          const glow = m.a * (0.65 + 0.35 * Math.sin(t * m.tw + m.ph));
          const px = (m.x + sway) * W;
          const py = m.y * H;
          const pr = m.r * (W / 1600 + 0.6);
          const grad = dctx.createRadialGradient(px, py, 0, px, py, pr * 3);
          grad.addColorStop(0, `rgba(230, 180, 34, ${glow})`);
          grad.addColorStop(1, "rgba(230, 180, 34, 0)");
          dctx.fillStyle = grad;
          dctx.beginPath();
          dctx.arc(px, py, pr * 3, 0, Math.PI * 2);
          dctx.fill();
        }
        dustRaf = requestAnimationFrame(tick);
      };

      dustObserver = new IntersectionObserver(
        ([entry]) => {
          const want = entry.isIntersecting;
          if (want && !dustOn) {
            dustOn = true;
            sizeDust();
            last = performance.now();
            dustRaf = requestAnimationFrame(tick);
          } else if (!want && dustOn) {
            dustOn = false;
            cancelAnimationFrame(dustRaf);
          }
        },
        { threshold: 0 }
      );
      dustObserver.observe(root);
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
        if (cap)
          cap.style.transform = `translateY(${(1 - fadeIn) * 40 + lp * -14}px)`;
        scene.style.zIndex = `${vis > 0.02 ? 2 : 1}`;
        // Parallax depth: annotations drift on a slightly different rate
        // than the photo (which scales up) — a few px of counter-travel
        // reads as the arrows floating just above the print.
        const callouts = scene.querySelectorAll<HTMLElement>(
          ".story-scenes__callout"
        );
        callouts.forEach((c) => {
          c.style.transform = `translateY(${lp * -22}px)`;
        });
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

        // Snap points: center of each scene's slice + boundaries.
        const snapPoints: number[] = [];
        for (let i = 0; i < n; i++) {
          snapPoints.push((i + 0.5) / n);
        }
        snapPoints.push(1);

        // Custom Lenis-based snapping. GSAP's built-in `snap` fights with
        // Lenis because Lenis owns the scroll position via its own
        // interpolation. Instead we watch for scroll-stop (via Lenis'
        // own event) and programmatically scrollTo the nearest snap point.
        let snapTimer = 0;
        let isSnapping = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let stInstance: any = null;

        const doSnap = () => {
          if (!stInstance) return;
          const lenis = getLenis();
          if (!lenis) return;

          const progress = stInstance.progress as number;
          // Don't snap at the very start or very end (allow natural
          // scroll out of the section).
          if (progress <= 0.01 || progress >= 0.99) return;

          // Find the nearest snap point.
          let best = snapPoints[0];
          let bestDist = Math.abs(progress - best);
          for (let i = 1; i < snapPoints.length; i++) {
            const d = Math.abs(progress - snapPoints[i]);
            if (d < bestDist) {
              bestDist = d;
              best = snapPoints[i];
            }
          }

          // Only snap if we're not already close enough.
          if (bestDist < 0.005) return;

          // Convert progress to an absolute scroll position.
          const triggerStart = stInstance.start as number;
          const triggerEnd = stInstance.end as number;
          const targetScroll = triggerStart + best * (triggerEnd - triggerStart);

          isSnapping = true;
          lenis.scrollTo(targetScroll, {
            duration: 0.8,
            easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
            onComplete: () => {
              isSnapping = false;
            },
          });
        };

        // Listen for Lenis scroll-stop to trigger snapping.
        const lenis = getLenis();
        const onLenisScroll = () => {
          if (isSnapping) return;
          window.clearTimeout(snapTimer);
          snapTimer = window.setTimeout(doSnap, 120);
        };
        if (lenis) {
          lenis.on("scroll", onLenisScroll);
        }

        stInstance = ScrollTrigger.create({
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          invalidateOnRefresh: true,
          // Measured after any upstream pin — matches StoryProcess.
          refreshPriority: -1,
          onUpdate: (self: { progress: number }) => applyProgress(self.progress),
          onRefresh: (self: { progress: number }) => applyProgress(self.progress),
        });

        // Store cleanup for the Lenis listener.
        (root as any).__storySnapCleanup = () => {
          window.clearTimeout(snapTimer);
          const l = getLenis();
          if (l) l.off("scroll", onLenisScroll);
        };
      }, root);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      window.clearTimeout(entryTimer);
      window.clearTimeout(entryDoneTimer);
      dustOn = false;
      cancelAnimationFrame(dustRaf);
      dustObserver?.disconnect();
      // Clean up Lenis snap listener.
      if (root && (root as any).__storySnapCleanup) {
        (root as any).__storySnapCleanup();
        delete (root as any).__storySnapCleanup;
      }
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

        {/* Golden dust — ambient motes over every beat (canvas, JS-driven). */}
        <canvas className="story-scenes__dust" aria-hidden="true" />


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
