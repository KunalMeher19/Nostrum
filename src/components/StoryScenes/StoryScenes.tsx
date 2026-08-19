"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  hasClientNavigated,
  CURTAIN_REVEAL_EVENT,
} from "../RouteCurtain/curtainNav";
import { getLenis } from "../SmoothScroll/lenisStore";
import "./story-scenes.css";
import { useLocale } from "../LocaleContext/LocaleContext";

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
    eyebrow: "scenes.s0_eyebrow",
    title: "scenes.s0_title",
    copy: "scenes.s0_copy",
    img: "/images/origin_1.png",
    alt: "Ancient olive tree above the Mediterranean coast at golden hour",
    callouts: [
      {
        label: "scenes.s0_c1",
        labelX: "47%",
        labelY: "36%",
        arrowX: "56%",
        arrowY: "42%",
        rotate: 32,
        delay: 0,
      },
      {
        label: "scenes.s0_c2",
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
    eyebrow: "scenes.s1_eyebrow",
    title: "scenes.s1_title",
    copy: "scenes.s1_copy",
    img: "/images/origin_2.png",
    alt: "Weathered hands passing fresh olives to a younger hand",
    callouts: [
      {
        label: "scenes.s1_c1",
        labelX: "50%",
        labelY: "20%",
        arrowX: "58%",
        arrowY: "25%",
        rotate: 38,
        delay: 0,
      },
      {
        label: "scenes.s1_c2",
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
    eyebrow: "scenes.s2_eyebrow",
    title: "scenes.s2_title",
    copy: "scenes.s2_copy",
    img: "/images/origin_3.png",
    alt: "Olives pouring from a wooden harvest crate at sunrise",
    callouts: [
      {
        label: "scenes.s2_c1",
        labelX: "48%",
        labelY: "18%",
        arrowX: "56%",
        arrowY: "23%",
        rotate: 22,
        delay: 0,
      },
      {
        label: "scenes.s2_c2",
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
  const { t } = useLocale();

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

    // Mobile/tablet: use slideshow-style navigation (same as CrispHeader)
    // Desktop: use scroll-based GSAP animation (original behavior)
    const isMobile = window.innerWidth <= 1024;

    if (isMobile) {
      // Mobile slideshow implementation
      root.classList.remove("is--pre");
      root.classList.add("is--mobile-slideshow");

      let cancelled = false;

      (async () => {
        try {
          const gsapMod = await import("gsap");
          const { CustomEase } = await import("gsap/CustomEase");
          const { SplitText } = await import("gsap/SplitText");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
          gsap.registerPlugin(CustomEase, SplitText);
          if (cancelled) return;

          // Same custom easing as CrispHeader slideshow
          CustomEase.create("slideshow-wipe", "0.625, 0.05, 0, 1");

          const scenes = Array.from(
            root.querySelectorAll<HTMLElement>(".story-scenes__scene")
          );
          const scenesInner = Array.from(
            root.querySelectorAll<HTMLElement>(".story-scenes__media")
          );
          const captions = Array.from(
            root.querySelectorAll<HTMLElement>(".story-scenes__caption")
          );
          const dots = Array.from(
            root.querySelectorAll<HTMLElement>(".story-scenes__dot")
          );

          let current = 0;
          const length = scenes.length;
          let animating = false;
          const animationDuration = 1.2; // Same as CrispHeader
          let scrollLocked = true; // Start locked (same as CrispHeader line 316)

          // Mark first scene as current
          scenes[0]?.classList.add("is--current", "is--live");
          dots[0]?.classList.add("is--active");

          // Get Lenis for scroll locking (same as CrispHeader)
          const getLenisInstance = () => {
            if (typeof window !== "undefined") {
              return (window as any).lenis || null;
            }
            return null;
          };

          // Lock Lenis immediately - start life in slideshow mode with page locked
          // (same as CrispHeader line 316: lenis.stop())
          const lenis = getLenisInstance();
          if (lenis && typeof lenis.stop === 'function') {
            lenis.stop();
          }

          // Text transition with SplitText (same as CrispHeader transitionText)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const splits: any[] = [];
          captions.forEach((caption) => {
            const h3 = caption.querySelector("h3");
            const p = caption.querySelector("p");
            if (h3) {
              const split = new SplitText(h3, { type: "words", linesClass: "split-line" });
              splits.push({ element: h3, split, p });
            }
          });

          function transitionText(index: number, direction: number) {
            const prevSplit = splits[current === 0 ? length - 1 : current - 1];
            const nextSplit = splits[index];
            if (!prevSplit || !nextSplit) return;

            const tl = gsap.timeline();

            // Exit: current text slides out
            if (prevSplit.split && prevSplit.split.words) {
              tl.to(
                prevSplit.split.words,
                {
                  yPercent: -direction * 110,
                  stagger: 0.03,
                  ease: "power2.in",
                  duration: 0.5,
                },
                0
              );
            }
            if (prevSplit.p) {
              tl.to(
                prevSplit.p,
                { opacity: 0, y: -direction * 10, ease: "power2.in", duration: 0.4 },
                0
              );
            }

            // Prime next text below/above
            tl.add(() => {
              if (nextSplit.split && nextSplit.split.words) {
                gsap.set(nextSplit.split.words, { yPercent: direction * 110 });
              }
              if (nextSplit.p) {
                gsap.set(nextSplit.p, { opacity: 0, y: direction * 10 });
              }
            });

            // Enter: incoming text rises into place
            tl.add(() => {
              if (nextSplit.split && nextSplit.split.words) {
                gsap.to(nextSplit.split.words, {
                  yPercent: 0,
                  stagger: 0.05,
                  ease: "expo.out",
                  duration: 0.8,
                });
              }
              if (nextSplit.p) {
                gsap.to(nextSplit.p, {
                  opacity: 1,
                  y: 0,
                  ease: "power2.out",
                  duration: 0.6,
                });
              }
            });
          }

          function navigate(direction: number) {
            if (animating) return;
            animating = true;

            const previous = current;
            current =
              direction === 1
                ? current < length - 1
                  ? current + 1
                  : current // Don't wrap at end
                : current > 0
                  ? current - 1
                  : current; // Don't wrap at start

            // If no change (at boundary), unlock and allow scroll
            if (current === previous) {
              animating = false;
              scrollLocked = false;
              const lenis = getLenisInstance();
              if (lenis && typeof lenis.start === 'function') {
                lenis.start();
              }
              return;
            }

            const currentScene = scenes[previous];
            const currentInner = scenesInner[previous];
            const upcomingScene = scenes[current];
            const upcomingInner = scenesInner[current];

            // Track if we're navigating TO the last slide
            const navigatingToLast = previous !== length - 1 && current === length - 1;

            gsap
              .timeline({
                defaults: { duration: animationDuration, ease: "slideshow-wipe" },
                onStart() {
                  upcomingScene.classList.add("is--current", "is--live");
                  dots[previous]?.classList.remove("is--active");
                  dots[current]?.classList.add("is--active");
                  transitionText(current, direction);
                },
                onComplete() {
                  currentScene.classList.remove("is--current", "is--live");
                  animating = false;

                  // ONLY unlock if we reached the last scene going down
                  // AND user has pending scroll intent
                  if (current === length - 1 && direction === 1 && pendingScroll) {
                    scrollLocked = false;
                    const lenis = getLenisInstance();
                    if (lenis && typeof lenis.start === 'function') {
                      lenis.start();
                    }
                    pendingScroll = false;
                  }
                  // If just arrived at last scene but no pending scroll, stay locked
                  // User must swipe again to unlock
                },
              })
              // Horizontal wipe with parallax (exact same as CrispHeader)
              .to(currentScene, { xPercent: -direction * 100 }, 0)
              .to(currentInner, { xPercent: direction * 75 }, 0)
              .fromTo(
                upcomingScene,
                { xPercent: direction * 100 },
                { xPercent: 0 },
                0
              )
              .fromTo(
                upcomingInner,
                { xPercent: -direction * 75 },
                { xPercent: 0 },
                0
              );
          }

          // Wheel handling (same debounce as CrispHeader: 1200ms)
          let lastWheelTime = 0;
          let pendingScroll = false; // Track if user wants to scroll past last scene

          const handleWheel = (e: WheelEvent) => {
            // Ignore horizontal scrolls
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

            const direction = e.deltaY > 0 ? 1 : -1;

            // At first scene scrolling up: allow natural scroll out
            if (current === 0 && direction === -1) {
              // Unlock scroll if locked
              if (scrollLocked) {
                scrollLocked = false;
                const lenis = getLenisInstance();
                if (lenis && typeof lenis.start === 'function') {
                  lenis.start();
                }
              }
              return; // Allow scroll to pass through
            }

            // At last scene scrolling down: handle carefully (SAME AS CRISPHEADER)
            if (current === length - 1 && direction === 1) {
              if (animating) {
                // Still animating TO the last scene - block ALL scroll
                e.preventDefault();
                e.stopPropagation();
                pendingScroll = true;
                return;
              }
              // On last scene, animation done, and not animating - unlock and allow scroll
              if (scrollLocked) {
                scrollLocked = false;
                const lenis = getLenisInstance();
                if (lenis && typeof lenis.start === 'function') {
                  lenis.start();
                }
              }
              // DO NOT preventDefault - let scroll pass through
              return;
            }

            // Inside slider bounds or animating: trap ALL scroll
            e.preventDefault();
            e.stopPropagation();

            // If still animating, block everything
            if (animating) return;

            // Reset pending scroll if user scrolls up
            if (direction === -1) pendingScroll = false;

            // Lock Lenis
            if (!scrollLocked) {
              scrollLocked = true;
              const lenis = getLenisInstance();
              if (lenis && typeof lenis.stop === 'function') {
                lenis.stop();
              }
            }

            const now = Date.now();
            if (now - lastWheelTime < 1200) return;

            navigate(direction);
            lastWheelTime = now;
          };

          // Touch handling (same as CrispHeader)
          let touchStartY = 0;

          const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
          };

          const handleTouchMove = (e: TouchEvent) => {
            const touchEndY = e.touches[0].clientY;
            const deltaY = touchStartY - touchEndY;
            const direction = deltaY > 0 ? 1 : -1;

            // At first scene swiping up: allow natural scroll
            if (current === 0 && direction === -1) {
              if (scrollLocked) {
                scrollLocked = false;
                const lenis = getLenisInstance();
                if (lenis && typeof lenis.start === 'function') {
                  lenis.start();
                }
              }
              return; // Allow scroll to pass through
            }

            // At last scene swiping down: handle carefully (same as CrispHeader)
            if (current === length - 1 && direction === 1) {
              e.preventDefault(); // Always prevent default at last scene
              if (animating) {
                pendingScroll = true;
                return;
              }
              // On last scene and not animating - unlock and allow scroll
              if (scrollLocked) {
                scrollLocked = false;
                const lenis = getLenisInstance();
                if (lenis && typeof lenis.start === 'function') {
                  lenis.start();
                }
              }
              return;
            }

            // Reset pending scroll on upward swipe
            if (direction === -1) pendingScroll = false;

            // CRITICAL: Trap scroll for ANY movement > 10px (same as CrispHeader line 870-872)
            if (Math.abs(deltaY) > 10) {
              e.preventDefault(); // Block native scroll
            } else {
              return; // Too small, ignore
            }

            const now = Date.now();
            if (animating || now - lastWheelTime < 1200) return;

            // Navigate only if movement > 30px
            if (Math.abs(deltaY) > 30) {
              // Lock scroll
              if (!scrollLocked) {
                scrollLocked = true;
                const lenis = getLenisInstance();
                if (lenis && typeof lenis.stop === 'function') {
                  lenis.stop();
                }
              }

              navigate(direction);
              lastWheelTime = now;
              touchStartY = touchEndY;
            }
          };

          root.addEventListener("wheel", handleWheel, { passive: false });
          root.addEventListener("touchstart", handleTouchStart, { passive: false });
          root.addEventListener("touchmove", handleTouchMove, { passive: false });

          // CRITICAL: Add document-level scroll prevention (like CrispHeader)
          // This prevents ANY scroll while we're locked, not just events on the section
          const preventDocumentScroll = (e: Event) => {
            if (scrollLocked) {
              e.preventDefault();
              e.stopPropagation();
            }
          };

          document.addEventListener("wheel", preventDocumentScroll, { passive: false });
          document.addEventListener("touchmove", preventDocumentScroll, { passive: false });

          (root as any).__storySnapCleanup = () => {
            root.removeEventListener("wheel", handleWheel);
            root.removeEventListener("touchstart", handleTouchStart);
            root.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("wheel", preventDocumentScroll);
            document.removeEventListener("touchmove", preventDocumentScroll);

            // Cleanup splits
            splits.forEach(({ split }) => {
              if (split && split.revert) split.revert();
            });

            // Unlock scroll
            const lenis = getLenisInstance();
            if (lenis && typeof lenis.start === 'function') {
              lenis.start();
            }
          };
        } catch (error) {
          console.error("StoryScenes: GSAP initialization failed", error);
          root.classList.remove("is--pre");
          root.classList.add("is--static");
        }
      })();

      return () => {
        cancelled = true;
        const cleanup = (root as any).__storySnapCleanup;
        if (cleanup) cleanup();
      };
    }

    // Desktop: original scroll-based GSAP animation
    root.classList.remove("is--pre");

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;

    const scenes = Array.from(
      root.querySelectorAll<HTMLElement>(".story-scenes__scene")
    );
    const dots = Array.from(
      root.querySelectorAll<HTMLElement>(".story-scenes__dot")
    );

    const n = scenes.length;
    if (!n) return;

    // Each scene owns a slice of the 0→1 progress
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const smooth = (v: number) => v * v * (3 - 2 * v);

    const applyProgress = (p: number) => {
      const span = 1 / n;
      let active = 0;
      for (let i = 0; i < n; i++) {
        const start = i * span;
        const local = (p - start) / span;
        const fadeIn = i === 0 ? 1 : smooth(clamp01(local / 0.35));
        const fadeOut =
          i === n - 1 ? 1 : 1 - smooth(clamp01((local - 0.65) / 0.35));
        const vis = clamp01(Math.min(fadeIn, fadeOut));

        const scene = scenes[i];
        scene.style.opacity = `${vis}`;
        const img = scene.querySelector<HTMLElement>(".story-scenes__media");
        const cap = scene.querySelector<HTMLElement>(".story-scenes__caption");
        const lp = clamp01(local);
        if (img) img.style.transform = `scale(${1.08 + lp * 0.08})`;
        if (cap)
          cap.style.transform = `translateY(${(1 - fadeIn) * 40 + lp * -14}px)`;
        scene.style.zIndex = `${vis > 0.02 ? 2 : 1}`;
        const callouts = scene.querySelectorAll<HTMLElement>(
          ".story-scenes__callout"
        );
        callouts.forEach((c) => {
          c.style.transform = `translateY(${lp * -22}px)`;
        });
        scene.classList.toggle("is--live", vis >= 0.45);
        if (vis >= 0.5) active = i;
      }
      dots.forEach((d, i) =>
        d.classList.toggle("is--active", i === active)
      );
    };

    (async () => {
      try {
        const gsapMod = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
        gsap.registerPlugin(ScrollTrigger);
        if (cancelled) return;

        applyProgress(0);

        ctx = gsap.context(() => {
          const snapPoints: number[] = [];
          for (let i = 0; i < n; i++) {
            snapPoints.push((i + 0.5) / n);
          }
          snapPoints.push(1);

          let snapTimer = 0;
          let isSnapping = false;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let stInstance: any = null;

          const doSnap = () => {
            if (!stInstance) return;
            const lenis = getLenis();
            if (!lenis) return;

            const progress = stInstance.progress as number;
            if (progress <= 0.01 || progress >= 0.99) return;

            let best = snapPoints[0];
            let bestDist = Math.abs(progress - best);
            for (let i = 1; i < snapPoints.length; i++) {
              const d = Math.abs(progress - snapPoints[i]);
              if (d < bestDist) {
                bestDist = d;
                best = snapPoints[i];
              }
            }

            if (bestDist < 0.005) return;

            const triggerStart = stInstance.start as number;
            const triggerEnd = stInstance.end as number;
            const targetScroll = triggerStart + best * (triggerEnd - triggerStart);

            isSnapping = true;
            lenis.scrollTo(targetScroll, {
              duration: 0.8,
              easing: (t: number) => 1 - Math.pow(1 - t, 3),
              onComplete: () => {
                isSnapping = false;
              },
            });
          };

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
            refreshPriority: -1,
            onUpdate: (self: { progress: number }) => applyProgress(self.progress),
            onRefresh: (self: { progress: number }) => applyProgress(self.progress),
          });

          (root as any).__storySnapCleanup = () => {
            window.clearTimeout(snapTimer);
            const l = getLenis();
            if (l) l.off("scroll", onLenisScroll);
          };
        }, root);

        ScrollTrigger.refresh();
      } catch (error) {
        console.error("StoryScenes: GSAP initialization failed", error);
        root.classList.remove("is--pre");
        root.classList.add("is--static");
      }
    })();

    return () => {
      cancelled = true;
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
      aria-label={t("scenes.aria")}
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
                  {t(c.label)}
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
              <p className="story-scenes__eyebrow">{t(s.eyebrow)}</p>
              <h2 className="story-scenes__title">{t(s.title)}</h2>
              <p className="story-scenes__copy">{t(s.copy)}</p>
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
