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

/* ---- Spotlight sticky config ---------------------------------------------- */
// Viewport offset (px) the pinned text holds while the media scrolls past —
// clear of the fixed nav. basicagency holds ~20px + a 35px adjustment; our
// nav needs a little more headroom.
const SPOTLIGHT_STICKY_TOP = 96;

/**
 * StorySection — the destination the pinned scrub releases into. Dark,
 * editorial, sparse (§2, §5).
 *
 * Redesigned (2026-07) after the basicagency.com home-spotlight section the
 * client's brief references (§1: "editorial confidence"): a two-column row —
 * poster-scale uppercase statement with an inline gold ● on the left, a tall
 * portrait visual on the right. The MEDIA column sets the section height and
 * scrolls naturally with the page (the motion the client liked); the TEXT
 * block stays put via a transform-driven sticky, releasing when its bottom
 * meets the media's bottom — reverse-engineered from basicagency's own
 * data-sticky implementation (they translate the block with an inline matrix;
 * we do the same from a ScrollTrigger onUpdate, which also sidesteps CSS
 * position:sticky pitfalls under Lenis + the transformed [data-main]).
 *
 * Its ink base matches the overlay's final frame for a seamless seam, and
 * the id="story" scroll-spy / "View our story" target is unchanged.
 */
export default function StorySection() {
  const rootRef = useRef<HTMLElement>(null);

  // Three scroll behaviours, one effect. Same conventions as the rest of the
  // file's consumers: dynamic gsap import, context, reduced-motion = static.
  //  1. Entrance reveal — content + media rise in as the section enters.
  //  2. Media drift — a subtle inner parallax inside the overflow-hidden
  //     frame, so the visual reads as "moving" beyond plain page scroll.
  //  3. The spotlight sticky (≥900px only — mobile stacks like the reference).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
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

      const row = root.querySelector<HTMLElement>(".story-spotlight__row");
      const sticky = root.querySelector<HTMLElement>(".story-spotlight__sticky");
      const media = root.querySelector<HTMLElement>(".story-spotlight__media");
      const drift = root.querySelector<HTMLElement>(
        ".story-spotlight__media-inner"
      );
      if (!row || !sticky || !media) return;

      ctx = gsap.context(() => {
        // 1 — Entrance: the sticky block's children stagger up, the media
        // fades up alongside. Scrubbed + reversible so scrolling back re-arms.
        const content = Array.from(sticky.children) as HTMLElement[];
        gsap.set(content, { y: 40, autoAlpha: 0 });
        gsap.set(media, { y: 48, autoAlpha: 0 });

        const enter = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top 85%",
            end: "top 25%",
            scrub: 3, // Matches the STA timeline's 3-second scrub
            invalidateOnRefresh: true,
            // Below the pinned hero — measure after its pin spacing applies
            // (same reason as the old StoryProcess triggers here).
            refreshPriority: -1,
          },
        });
        enter.to(content, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, 0);
        enter.to(media, { y: 0, autoAlpha: 1, duration: 0.85 }, 0.1);

        // 2 — Media drift: the image (oversized 116% of its frame) slides
        // through the frame across the section's whole time on screen.
        // ease:"none" locks it to the scrub so it parallaxes both directions.
        if (drift) {
          gsap.fromTo(
            drift,
            { yPercent: -6.5 },
            {
              yPercent: 6.5,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top bottom",
                end: "bottom top",
                scrub: 3,
                invalidateOnRefresh: true,
                refreshPriority: -1,
              },
            }
          );
        }

        // 3 — The spotlight sticky. Trigger geometry makes (end − start)
        // exactly the sticky's travel (row height − sticky height), so
        // y = progress × (end − start) holds the block SPOTLIGHT_STICKY_TOP
        // from the viewport top, then parks it flush with the media's bottom
        // — the same clamp basicagency's sticky lands on. gsap.set (no scrub)
        // because Lenis already smooths the scroll; a second lerp here would
        // make the "pin" visibly swim.
        const mm = gsap.matchMedia();
        mm.add("(min-width: 900px)", () => {
          const st = ScrollTrigger.create({
            trigger: row,
            start: () => `top ${SPOTLIGHT_STICKY_TOP}`,
            end: () => `bottom ${SPOTLIGHT_STICKY_TOP + sticky.offsetHeight}`,
            onUpdate(self: {
              progress: number;
              start: number;
              end: number;
            }) {
              gsap.set(sticky, {
                y: self.progress * Math.max(0, self.end - self.start),
              });
            },
            invalidateOnRefresh: true,
            refreshPriority: -1,
          });
          return () => {
            st.kill();
            gsap.set(sticky, { y: 0 });
          };
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
      id="story"
      ref={rootRef}
      className="story-section story-spotlight"
      aria-label="Our story"
    >
      {/* DOM order media→text (like the reference): mobile stacks the visual
          on top; ≥900px row-reverse puts the text left, media right. */}
      <div className="story-spotlight__row">
        <div className="story-spotlight__col is--media">
          <div className="story-spotlight__media">
            <div className="story-spotlight__media-inner">
              <Image
                className="story-spotlight__image"
                src="/images/1.png"
                alt="Ripe olives on the branch in the Nostrum grove"
                fill
                sizes="(max-width: 899px) 92vw, 46vw"
              />
            </div>
          </div>
        </div>
        <div className="story-spotlight__col is--text">
          <div className="story-spotlight__sticky">
            <h2 className="story-spotlight__quote">
              Nostrum is born of the grove{" "}
              <span className="story-spotlight__dot" aria-hidden="true">
                ●
              </span>{" "}
              pressed within hours
            </h2>
            <p className="story-spotlight__label">
              The grove <strong>Mediterranean coast</strong>
            </p>
            <p className="story-spotlight__cta-row">
              <Link href="/origins" className="story-spotlight__pill">
                Our origins
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
