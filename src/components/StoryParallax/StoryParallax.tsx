"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "./story-parallax.css";

/* ------------------------------------------------------------------ */
/* StoryParallax                                                       */
/*                                                                     */
/* The transition beat that closes the scroll-through animation (STA)  */
/* and hands off to the Story section. It is deliberately NOT its own   */
/* ScrollTrigger: per the "one continuous pinned scroll" direction, it  */
/* rides the SAME pinned timeline the STA already owns in CrispHeader.  */
/* CrispHeader renders <StoryParallaxOverlay/> inside its pinned hero   */
/* and calls initStoryParallax() to append the tail tweens.            */
/* ------------------------------------------------------------------ */

/**
 * StoryParallaxOverlay — the layered markup. Rendered inside the pinned
 * hero, above the frame canvas and hero content, but inert (hidden, no
 * pointer events) until the STA scrub reveals it near the end.
 */
export function StoryParallaxOverlay() {
  return (
    <div className="story-parallax" data-story-parallax aria-hidden="true">
      <div className="story-parallax__layer is--base" data-parallax-layer="1" />
      <div className="story-parallax__layer is--olive" data-parallax-layer="2" />
      <div className="story-parallax__layer is--bark" data-parallax-layer="3" />
      <div className="story-parallax__fade" />
      <div className="story-parallax__layer is--title" data-parallax-layer="4">
        <div className="story-parallax__title-wrap">
          <h2 className="story-parallax__title">Our Story</h2>
          <p className="story-parallax__eyebrow">From the land</p>
        </div>
      </div>
    </div>
  );
}

/* ---- Tail-tween config ---------------------------------------------------- */
// Where in the STA timeline (0 → 1, the whole pinned scrub) the parallax
// begins. The STA frame scrub spans the full timeline, so 0.86 lands the
// entrance in the last ~14% — roughly the final 15 frames, which keep
// advancing to 240 (and shrinking/fading) *while* the layers rise. Tunable.
const STORY_PARALLAX_START = 0.86;

// Per-layer rise. Each enters from below (yPercent 118) and settles at a
// slightly different offset + scale, so they separate into depth planes as
// the scrub drives them up and down — the parallax. The ink base (layer 1)
// rises slowest and ends full-bleed (yPercent 0, scale 1) so it becomes the
// clean backdrop the title sits on and the Story section continues from.
type LayerSpec = { layer: string; y: number; from: number; scale: number };
const LAYERS: LayerSpec[] = [
  { layer: "1", y: 0, from: 118, scale: 1.0 }, // ink base — covers at the end
  { layer: "2", y: -6, from: 128, scale: 0.92 }, // deep-olive plane
  { layer: "3", y: -11, from: 138, scale: 0.86 }, // bark-brown plane
  { layer: "4", y: 0, from: 122, scale: 1.0 }, // title
];

interface InitArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gsap: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tl: any; // the STA timeline (gsap.timeline bound to the pinned ScrollTrigger)
  host: HTMLElement; // the pinned hero; the overlay is queried from within it
  canvas: HTMLCanvasElement; // the STA frame canvas — recedes + fades here
  start?: number;
}

/**
 * initStoryParallax — appends the closing transition to the STA timeline.
 * Called from CrispHeader.initScrollThrough after the frame scrub is built,
 * so it shares the pinned ScrollTrigger and scrubs in lockstep with the STA.
 *
 * The CANVAS fade/scale and slider hide stay on the STA's own timeline (they
 * must stay coupled with the frame scrub for correct visual occlusion). But
 * the LAYER RISE animations are driven by a SEPARATE ScrollTrigger with a much
 * tighter scrub (0.8 vs STA's 3), so they track scroll position responsively
 * rather than trailing 3 seconds behind on a fast flick. The two triggers
 * cover the same scroll range (86% → 100% of the STA pin distance) — the
 * layers just chase the target faster.
 */
export function initStoryParallax({
  gsap,
  tl,
  host,
  canvas,
  start = STORY_PARALLAX_START,
}: InitArgs) {
  const root = host.querySelector<HTMLElement>(".story-parallax");
  if (!root) return;

  const dur = 1 - start;

  // Reveal the overlay instantly when scroll crosses the start boundary.
  // We use a separate ScrollTrigger (instead of tl.set) so the reveal isn't 
  // delayed by the STA's scrub: 3. This ensures the overlay covers the screen 
  // immediately on a fast flick, while the actual rise animations (below) still
  // enjoy the smooth 3-second momentum.
  const staST = tl.scrollTrigger;
  if (staST) {
    gsap.timeline({
      scrollTrigger: {
        trigger: host,
        start: () => {
          const staStart = staST.start as number;
          const staEnd = staST.end as number;
          return staStart + (staEnd - staStart) * start;
        },
        end: () => staST.end,
        onEnter: () => gsap.set(root, { autoAlpha: 1 }),
        onLeaveBack: () => gsap.set(root, { autoAlpha: 0 }),
        invalidateOnRefresh: true,
      }
    });
  }

  // The STA keeps playing — frames still scrub to 240 — but the canvas now
  // exits: it scales down AND drifts up and out through the top of the frame
  // while fading, so the bottle lifts away as the layers rise rather than just
  // shrinking in place. transform-origin is upper-centre (CSS) so the shrink
  // reads as pulling toward the top.
  tl.to(
    canvas,
    {
      scale: 0.5,
      yPercent: -65,
      autoAlpha: 0,
      ease: "power2.in",
      duration: dur,
    },
    start
  );

  // The frame canvas is drawn OVER the static frame-001 slideshow slide. During
  // the normal STA scrub the full-bleed opaque canvas completely covers that
  // slide, but the instant the canvas starts scaling/fading in the tail the
  // static frame-001 bottle is revealed behind it — a second, ghost bottle that
  // shrinks alongside the real one (the bug). Because the canvas fully covers
  // the slide at the exact moment the tail begins, hide it instantly here: the
  // cut is invisible (canvas is still opaque over it) and it reverts when the
  // scrub runs back up. This only touches the pinned tail timeline, so the
  // slideshow's own use of the slider is unaffected.
  const slider = host.querySelector<HTMLElement>(".crisp-header__slider");
  if (slider) {
    tl.set(slider, { autoAlpha: 0 }, start);
  }

  // --- Layer-rise tweens on their OWN ScrollTrigger (scrub: 3) ------------
  // The STA's ScrollTrigger tells us its computed scroll range. The layer
  // trigger covers the tail portion (start → 1.0) of that same range.
  // By putting the layers on their own trigger with scrub: 3, they begin their
  // smooth 3-second rise IMMEDIATELY when the user scrolls past the boundary,
  // perfectly synchronizing with the StorySection's 3-second scrub below it.
  const layerTl = gsap.timeline({
    scrollTrigger: {
      trigger: host,
      start: () => {
        const staStart = staST.start as number;
        const staEnd = staST.end as number;
        return staStart + (staEnd - staStart) * start;
      },
      end: () => staST.end,
      scrub: 3, // Matches STA momentum and StorySection momentum
      invalidateOnRefresh: true,
    },
  });

  // Layers rise + shrink with a small per-layer stagger so they arrive as
  // separated depth planes (back-to-front). ease:"none" keeps them locked to
  // the scrub, so scrolling up and down parallaxes them up and down.
  LAYERS.forEach((spec, idx) => {
    const el = root.querySelector<HTMLElement>(
      `[data-parallax-layer="${spec.layer}"]`
    );
    if (!el) return;
    const offset = idx * 0.06; // tiny cascade, same relative spacing as before
    layerTl.fromTo(
      el,
      { yPercent: spec.from, scale: spec.scale * 1.12 },
      {
        yPercent: spec.y,
        scale: spec.scale,
        ease: "none",
        duration: 1 - offset,
      },
      offset
    );
  });
}

/**
 * StorySection — the destination the pinned scrub releases into. Dark,
 * editorial, sparse (§2, §5). Client direction (2026-07): the full process
 * timeline stretched the homepage (worst on mobile), so it now lives on
 * /origins and this section is a one-viewport TEASER that hands off to it —
 * short copy + one visual + CTA, using the .story-section__* split layout.
 * Its ink base matches the overlay's final frame for a seamless seam, and
 * the id="story" scroll-spy / "View our story" target is unchanged.
 */
export default function StorySection() {
  const innerRef = useRef<HTMLDivElement>(null);

  // One-shot reveal on enter, mirroring the step reveals the timeline had
  // here: content rises in a small stagger, the visual fades up. Reversible
  // so scrolling back re-arms it. Same conventions as the rest of the file's
  // consumers: dynamic gsap import, context, reduced-motion = static.
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;

      const content = Array.from(
        inner.querySelectorAll<HTMLElement>(".story-section__content > *")
      );
      const visual = inner.querySelector<HTMLElement>(".story-section__visual");

      ctx = gsap.context(() => {
        gsap.set(content, { y: 40, autoAlpha: 0 });
        if (visual) gsap.set(visual, { y: 48, autoAlpha: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: inner,
            start: "top 85%",
            end: "top 25%",
            scrub: 3, // Matches the STA timeline's 3-second scrub
            invalidateOnRefresh: true,
            // Below the pinned hero — measure after its pin spacing applies
            // (same reason as the old StoryProcess triggers here).
            refreshPriority: -1,
          },
        });
        tl.to(content, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, 0);
        if (visual) {
          tl.to(visual, { y: 0, autoAlpha: 1, duration: 0.85 }, 0.1);
        }
      }, inner);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section id="story" className="story-section" aria-label="Our story">
      <div ref={innerRef} className="story-section__inner">
        <div className="story-section__content">
          <p className="story-section__eyebrow">From the land</p>
          <h2 className="story-section__heading">Born of the grove</h2>
          <p className="story-section__lead">
            A family grove on the Mediterranean coast — harvested by hand,
            pressed within hours of picking. The story of how it&rsquo;s made
            lives in Origins.
          </p>
          <Link href="/origins" className="story-section__cta">
            Discover our origins
          </Link>
        </div>
        <div className="story-section__visual">
          <Image
            className="story-section__image"
            src="/images/1.png"
            alt="Ripe olives on the branch in the Nostrum grove"
            fill
            sizes="(max-width: 899px) 92vw, 42vw"
          />
        </div>
      </div>
    </section>
  );
}
