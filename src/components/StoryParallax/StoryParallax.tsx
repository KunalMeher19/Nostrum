"use client";

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
        <p className="story-parallax__eyebrow">From the land</p>
        <h2 className="story-parallax__title">Our Story</h2>
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

  // Reveal the overlay exactly as the tail begins (mirrors the canvas's own
  // autoAlpha gate). Before this it stays visibility:hidden so it can't cover
  // slides 1-4, which all live at scrollY 0 under the wheel-jack.
  tl.set(root, { autoAlpha: 1 }, start);

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

  // Layers rise + shrink with a small per-layer stagger so they arrive as
  // separated depth planes (back-to-front). ease:"none" keeps them locked to
  // the scrub, so scrolling up and down parallaxes them up and down.
  //
  // The solid layers are kept fully OPAQUE the whole rise (no autoAlpha fade) so
  // they physically OCCLUDE the receding bottle as they slide up over it — the
  // whole point of the effect. Fading them in instead makes them translucent,
  // so the frame-001 bottle behind shows straight through them (the bug). The
  // root `.story-parallax` visibility gate (set above) is what keeps them
  // hidden before the tail begins, so no per-layer opacity is needed here.
  LAYERS.forEach((spec, idx) => {
    const el = root.querySelector<HTMLElement>(
      `[data-parallax-layer="${spec.layer}"]`
    );
    if (!el) return;
    const offset = start + idx * dur * 0.06; // tiny cascade within the tail
    tl.fromTo(
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
 * editorial, sparse (§2, §5) with rich placeholders for the real History
 * copy + photography to drop in later. Rendered in normal flow after the
 * hero; its ink base matches the overlay's final frame for a seamless seam.
 */
export default function StorySection() {
  return (
    <section className="story-section" aria-label="Our story">
      <div className="story-section__inner">
        <p className="story-section__eyebrow">From the land</p>
        <h2 className="story-section__heading">Not simply olive oil.</h2>
        <p className="story-section__lead">
          Cold-pressed from the first harvest, bottled with intent. The Nostrum
          story continues here — real words and photographs, soon.
        </p>
      </div>
    </section>
  );
}
