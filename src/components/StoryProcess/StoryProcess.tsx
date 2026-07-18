"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import "./story-process.css";

/* ------------------------------------------------------------------ */
/* StoryProcess                                                        */
/*                                                                     */
/* The process-timeline scrollytelling. Lived in the homepage Story     */
/* section until 2026-07, when the client asked for it on /origins       */
/* instead (it stretched the home, worst on mobile) — the Origins page   */
/* now renders it; Home keeps a one-viewport teaser that links there.    */
/* Five steps of how the oil is made, alternating L/R. The section      */
/* scrolls NATURALLY (no pin). Two motion systems, both scroll-driven:  */
/*                                                                      */
/*  1. THE STROKE — the wild comgio/Skiper19 path the client chose.     */
/*     Its exact `d` is stretched down the whole track and GROWS with   */
/*     scroll via strokeDashoffset (the GSAP equivalent of framer's     */
/*     `pathLength`), so the line snakes down through the steps as you   */
/*     scroll, a glowing head riding its tip.                           */
/*                                                                      */
/*  2. STEP REVEALS — each step has its OWN ScrollTrigger that plays a   */
/*     one-shot timeline as it enters view: image slides in from its    */
/*     side (step 1 left, step 2 right, alternating) and the text rises  */
/*     in a small stagger. Reversible, so scrolling back up resets it.   */
/*                                                                      */
/* Conventions match the codebase: dynamic gsap import, ScrollTrigger,  */
/* gsap.context() with revert on cleanup. Lenis is global (SmoothScroll)*/
/* and drives ScrollTrigger.update(), so everything rides Lenis' smooth  */
/* interpolated scroll.                                                  */
/* ------------------------------------------------------------------ */

/**
 * buildWildPath — a procedurally generated stroke that keeps the wild,
 * hand-drawn comgio CHARACTER (big organic swoops, curls and overshoots) while
 * still travelling top → bottom and threading through every step's node, so it
 * genuinely works as a scroll tracker. Built in PIXEL space against the track
 * box (recomputed on every refresh) — the earlier attempt reused the literal
 * comgio path, whose `d` doubles back on itself vertically and so bunched all
 * its loops in one region instead of following the steps.
 *
 * `nodes` are the points the line must pass through (intro + each step); it
 * enters/leaves each with a vertical tangent, and between two nodes it bows out
 * to alternating sides in ONE smooth arc. Every join (node → peak → node) shares
 * a vertical tangent, so the stroke is guaranteed kink-/cusp-free — "mildly
 * wild": organic and swaying, but with no bad turns.
 */
function buildWildPath(nodes: { x: number; y: number }[], W: number, H: number): string {
  if (nodes.length < 2) return "";
  const a0 = nodes[0];
  const a1 = nodes[1];
  const f = (n: number) => n.toFixed(1);
  // On phones the full-width swings (amp up to W*0.5) throw the line right
  // across the reading column and read as chaotic noise rather than an
  // organic thread. Narrow the horizontal excursion on small viewports so it
  // stays a graceful ribbon down the side of the steps.
  const mobile = W <= 540;
  // Desktop swing was up to HALF the viewport width (ampMax 0.5), which threw
  // the line into the screen edges and read as chaotic. Pull it back to a
  // "mildly wild" range so it sways beside the steps instead of slamming the
  // margins. Mobile was already gentle — left as-is.
  const ampMin = mobile ? 0.12 : 0.16;
  const ampMax = mobile ? 0.22 : 0.3;
  const ampK = mobile ? 0.4 : 0.4;

  // A clean, 2-stroke horizontal scribble functioning purely as an underline,
  // sitting firmly near the baseline (a0.y) to ensure it never slices the text.
  let d = `M ${f(a0.x - 90)} ${f(a0.y - 2)}`;
  // Stroke 1: Left to right (slight wave)
  d += ` C ${f(a0.x - 30)} ${f(a0.y - 5)}, ${f(a0.x + 40)} ${f(a0.y - 1)}, ${f(a0.x + 90)} ${f(a0.y - 2)}`;
  // Stroke 2: Loop back left, dipping slightly lower
  d += ` C ${f(a0.x + 110)} ${f(a0.y - 5)}, ${f(a0.x + 10)} ${f(a0.y + 3)}, ${f(a0.x - 50)} ${f(a0.y + 2)}`;
  // Final exit: plunge downwards into the first step
  d += ` C ${f(a0.x - 80)} ${f(a0.y)}, ${f(a0.x)} ${f(a0.y + 100)}, ${f(a1.x)} ${f(a1.y)}`;

  for (let i = 2; i < nodes.length; i++) {
    const a = nodes[i - 1];
    const b = nodes[i];
    const dy = b.y - a.y;
    // ONE clean bow per leg, alternating L/R for a balanced weave. The bow's
    // widest point (the "peak") sits mid-leg, offset sideways by `amp`. Every
    // anchor of the leg — node a, the peak, node b — is entered AND left with a
    // VERTICAL tangent, so all three joins (and the join to the next leg, also
    // vertical) are automatically smooth: no cusps, no flat shelves, none of the
    // "small imperfections" the client saw. y stays monotonic so the scroll-draw
    // still grows cleanly downward.
    const bow = i % 2 === 0 ? -1 : 1;
    // Gentle per-leg variation (deterministic — must be stable across the many
    // path rebuilds) keeps it "mildly wild" rather than a mechanical sine: the
    // amplitude wobbles and the peak sits a touch high/low on alternating legs.
    const wob = [1, 0.82, 1.14, 0.9, 1.06][(i - 2) % 5];
    const amp = wob * Math.min(W * ampMax, Math.max(W * ampMin, Math.abs(dy) * ampK));
    const peakX = (a.x + b.x) / 2 + bow * amp;
    const peakY = a.y + dy * (i % 2 === 0 ? 0.54 : 0.46);
    const spanA = peakY - a.y;
    const spanB = b.y - peakY;

    // Seg A — node a → bow peak (vertical tangent at both ends).
    d += ` C ${f(a.x)} ${f(a.y + spanA * 0.5)}, ${f(peakX)} ${f(peakY - spanA * 0.5)}, ${f(peakX)} ${f(peakY)}`;
    // Seg B — bow peak → node b (vertical tangent at both ends).
    d += ` C ${f(peakX)} ${f(peakY + spanB * 0.5)}, ${f(b.x)} ${f(b.y - spanB * 0.5)}, ${f(b.x)} ${f(b.y)}`;
  }
  const last = nodes[nodes.length - 1];
  const endY = Math.min(last.y + 350, H);
  const tailDy = endY - last.y;
  d += ` C ${f(last.x)} ${f(last.y + tailDy * 0.33)}, ${f(last.x)} ${f(last.y + tailDy * 0.66)}, ${f(last.x)} ${f(endY)}`;
  return d;
}

type Step = {
  num: string;
  title: string;
  copy: string;
  img: string;
  alt: string;
};

// Placeholder copy (few words, on-brand) + placeholder imagery reusing the
// hero stills until real process photography arrives. Edit freely.
const STEPS: Step[] = [
  {
    num: "01",
    title: "Harvest",
    copy: "Hand-picked at first light, at the peak of ripeness.",
    img: "/images/1.png",
    alt: "Ripe olives on the branch",
  },
  {
    num: "02",
    title: "Wash & Sort",
    copy: "Leaves and stems away — only clean fruit remains.",
    img: "/images/5.png",
    alt: "Olive leaves and fruit",
  },
  {
    num: "03",
    title: "Crush & Malaxation",
    copy: "Stone-milled to a paste, slowly kneaded to free the oil.",
    img: "/images/4.png",
    alt: "Olive oil surface",
  },
  {
    num: "04",
    title: "Cold Extraction",
    copy: "Separated below 27°C, so nothing of the fruit is lost.",
    img: "/images/2.png",
    alt: "Oil drawn from the press",
  },
  {
    num: "05",
    title: "Bottling",
    copy: "Sealed fresh from the mill — first cold pressing only.",
    img: "/images/3.png",
    alt: "Bottle shoulder reflection",
  },
];

export default function StoryProcess() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const line = root.querySelector<SVGPathElement>(".story-process__spine-line");
    const svg = root.querySelector<SVGSVGElement>(".story-process__spine");
    const track = root.querySelector<HTMLElement>(".story-process__track");
    const intro = root.querySelector<HTMLElement>(".story-process__intro");
    const steps = Array.from(
      root.querySelectorAll<HTMLElement>(".story-process__step")
    );

    // The points the wild stroke threads through: the intro title, then each
    // step's image on its inner edge (left step → 40% across, right step → 60%)
    // so the line swings side-to-side through the actual images.
    const computeNodes = (W: number): { x: number; y: number }[] => {
      const nodes: { x: number; y: number }[] = [];
      if (intro) {
        let startX = W * 0.5;
        let startY = intro.offsetTop + intro.offsetHeight * 0.72;
        const titleWrap = intro.querySelector<HTMLElement>(".story-process__title-wrap");
        if (titleWrap && track) {
          const trackRect = track.getBoundingClientRect();
          const titleRect = titleWrap.getBoundingClientRect();
          startX = (titleRect.left - trackRect.left) + titleRect.width / 2;
          startY = (titleRect.bottom - trackRect.top) + 20; // 20px precisely below the text wrap
        }
        nodes.push({ x: startX, y: startY });
      }
      steps.forEach((step) => {
        const side = step.dataset.side === "right" ? 0.6 : 0.4;
        nodes.push({ x: W * side, y: step.offsetTop + step.offsetHeight / 2 });
      });
      return nodes;
    };

    // Arc-length total + a sampled map of arc-length → y, rebuilt on each
    // paint. y is (near-)monotonic top→bottom, so this lets us drive the draw
    // by VERTICAL position instead of arc-length (see lengthAtYFraction).
    let total = 0;
    let ySamples: { len: number; y: number }[] = [];
    // The `d` we last sampled. paintPath is invoked from EVERY global
    // ScrollTrigger.refresh (via the stroke trigger's onRefresh) — several of
    // which fire back-to-back around the hero loader's hand-off — but the
    // expensive part (260 getPointAtLength samples ≈ 50ms) only has meaning
    // when the path GEOMETRY changed. Keying on the built `d` string skips the
    // resample whenever layout is unchanged, which is what turned the loader
    // hand-off frames into long-task jank.
    let sampledD = "";

    // Set the SVG's viewBox to the track's pixel box (1 unit = 1px) and write
    // the freshly-built wild path. Returns the path length.
    const paintPath = (): number => {
      if (!svg || !line || !track) return 0;
      const W = track.offsetWidth;
      const H = track.offsetHeight;
      const d = buildWildPath(computeNodes(W), W, H);
      if (d === sampledD) return total; // geometry unchanged — reuse samples
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      line.setAttribute("d", d);
      total = line.getTotalLength();
      // Sample arc-length → y so we can map a vertical target back to a length.
      const N = 260;
      ySamples = [];
      for (let i = 0; i <= N; i++) {
        const len = (i / N) * total;
        ySamples.push({ len, y: line.getPointAtLength(len).y });
      }
      sampledD = d;
      return total;
    };

    // The arc-length at which the stroke reaches vertical fraction `p` (0 = top
    // of the stroke, 1 = bottom). Because the path descends monotonically, a
    // p-linear-in-y mapping makes the drawn TIP descend at constant speed as
    // you scroll — so the wild lower legs (long arc, little vertical gain) draw
    // FAST enough to reach steps 3–5 while they're still on screen, instead of
    // lagging as a raw arc-length mapping did.
    const lengthAtYFraction = (p: number): number => {
      if (ySamples.length < 2) return p * total;
      const y0 = ySamples[0].y;
      const y1 = ySamples[ySamples.length - 1].y;
      const targetY = y0 + (y1 - y0) * Math.min(1, Math.max(0, p));
      for (let i = 1; i < ySamples.length; i++) {
        if (ySamples[i].y >= targetY) {
          const a = ySamples[i - 1];
          const b = ySamples[i];
          const t = b.y === a.y ? 0 : (targetY - a.y) / (b.y - a.y);
          return a.len + (b.len - a.len) * t;
        }
      }
      return total;
    };

    // Reduced motion: no scrub, no slide. Draw the full stroke, reveal all
    // steps in place. Rebuild on resize (and on the display:none→visible flip).
    if (prefersReduced) {
      root.classList.add("is--static");
      const drawFull = () => {
        const total = paintPath();
        if (line) {
          line.style.strokeDasharray = `${total}`;
          line.style.strokeDashoffset = "0";
        }
      };
      let rid = 0;
      const roStatic = new ResizeObserver(() => {
        cancelAnimationFrame(rid);
        rid = requestAnimationFrame(drawFull);
      });
      if (track) roStatic.observe(track);
      return () => {
        cancelAnimationFrame(rid);
        roStatic.disconnect();
      };
    }

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scrollTriggerRef: any = null;
    // Track size as of the last completed global refresh (see onStRefresh).
    let refreshedW = -1;
    let refreshedH = -1;
    let onStRefresh: (() => void) | null = null;

    // On phones the section is a single centred column, so a big sideways
    // slide-in fights the layout and feels heavy. Use a lighter, quicker
    // rise-and-fade there; keep the cinematic sideways travel on wider screens.
    const isMobile = window.matchMedia("(max-width: 540px)").matches;

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled || !line) return;
      scrollTriggerRef = ScrollTrigger;

      // Record the track's size every time a global refresh completes. The
      // ResizeObserver below uses this to skip its own refresh when the size
      // it observed has ALREADY been measured — e.g. at the loader hand-off,
      // where the hero's initScrollThrough runs a global refresh on the same
      // frame the sections become visible and the RO's follow-up (one frame
      // later) would repeat the identical ~100ms measure pass for nothing.
      onStRefresh = () => {
        if (track) {
          refreshedW = track.offsetWidth;
          refreshedH = track.offsetHeight;
        }
      };
      ScrollTrigger.addEventListener("refresh", onStRefresh);

      // Build the wild path from the live layout so it threads each step. The
      // SVG uses a 1:1 pixel viewBox (set here) so path coords == track px.
      const draw = { p: 0 };
      paintPath();
      // Reveal by VERTICAL position, not raw arc-length — keeps the tip
      // descending at a constant vertical pace so it reaches every step on time.
      const drawnLen = () => lengthAtYFraction(draw.p);
      gsap.set(line, {
        strokeDasharray: total,
        strokeDashoffset: total,
      });

      ctx = gsap.context(() => {
        gsap.to(draw, {
          p: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top 55%",
            end: "92% bottom",
            scrub: 1,
            invalidateOnRefresh: true,
            // Rebuild the path whenever ScrollTrigger recomputes (resize / the
            // display:none→visible flip after the hero loader), so it always
            // matches the current step layout.
            onRefresh: () => {
              paintPath();
              gsap.set(line, {
                strokeDasharray: total,
                strokeDashoffset: total - drawnLen(),
              });
            },
            // The hero above is PINNED (adds ~6.5×vh of scroll distance). A
            // trigger below a pin must be measured AFTER the pin applies its
            // spacing, or it computes start/end in pre-pin coordinates and runs
            // while this section is still off-screen. Lower priority = refreshed
            // after the hero's pin (default 0), so our positions include it.
            refreshPriority: -1,
          },
          onUpdate: () => {
            line.style.strokeDashoffset = `${total - drawnLen()}`;
          },
        });

        // ---- 2. STEP REVEALS — one timeline per step, on enter -----------
        steps.forEach((step) => {
          const visual = step.querySelector<HTMLElement>(".story-process__visual");
          const text = Array.from(
            step.querySelectorAll<HTMLElement>(".story-process__text > *")
          );
          const dir = step.dataset.side === "right" ? 1 : -1;

          // Resting (pre-reveal) state. Mobile: a small sideways nudge + rise
          // (cheap, no full-width travel); desktop: the full cinematic slide.
          if (visual)
            gsap.set(visual, {
              xPercent: isMobile ? dir * 14 : dir * 85,
              y: isMobile ? 28 : 0,
              autoAlpha: 0,
            });
          if (text.length)
            gsap.set(text, { y: isMobile ? 24 : 40, autoAlpha: 0 });

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              // Trigger off the IMAGE, not the 86vh-tall step article — the
              // article's top enters the viewport long before its centred image
              // does, which fired the reveal too early. Anchoring to the visual
              // makes each step arrive AS the growing stroke reaches it.
              trigger: visual || step,
              // Image's top at 82% down the viewport → it's just entering from
              // below as it reveals; the slide-in finishes as it settles into
              // view. Tuned so the reveal reads as "the line arrives, the image
              // appears," not a snap already on-screen.
              start: "top 82%",
              // play on enter, reverse when scrolled back above — so revisiting
              // the section re-runs the reveal instead of snapping in.
              toggleActions: "play none none reverse",
              invalidateOnRefresh: true,
              // Same as the stroke: measure after the hero's pin (see above),
              // else each step reveals while still below the fold.
              refreshPriority: -1,
            },
          });

          if (visual) {
            tl.to(
              visual,
              {
                xPercent: 0,
                y: 0,
                autoAlpha: 1,
                duration: isMobile ? 0.7 : 1.1,
              },
              0
            );
          }
          if (text.length) {
            tl.to(
              text,
              {
                y: 0,
                autoAlpha: 1,
                duration: isMobile ? 0.6 : 0.9,
                stagger: isMobile ? 0.08 : 0.12,
              },
              isMobile ? 0.1 : 0.15
            );
          }
        });
      }, root);

      // Section starts display:none during the hero loader → first layout is
      // zero-height. Rebuild triggers the moment it becomes visible / reflows.
      ScrollTrigger.refresh();
    })();

    // ResizeObserver lives outside the async IIFE so cleanup always sees it.
    let rafId = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Recompute trigger start/end once the section flips from display:none
        // (hero loader) to visible, or on any reflow. getTotalLength is in
        // viewBox units so the stroke itself needs no rebuild — only the
        // trigger positions do. scrollTriggerRef is null until gsap imports.
        //
        // Skip when a global refresh has ALREADY measured this exact size:
        // at the loader hand-off the hero's initScrollThrough refreshes on the
        // same frame the section becomes visible, so the RO's follow-up one
        // frame later would repeat the identical full-page measure (~100ms)
        // right as input unlocks — the residual post-loader hitch. A real
        // resize changes the track box, misses this guard, and refreshes.
        if (
          track &&
          track.offsetWidth === refreshedW &&
          track.offsetHeight === refreshedH
        ) {
          return;
        }
        scrollTriggerRef?.refresh?.();
      });
    });
    if (track) ro.observe(track);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      if (onStRefresh) scrollTriggerRef?.removeEventListener?.("refresh", onStRefresh);
      ctx?.revert();
    };
  }, []);

  return (
    <section
      className="story-process"
      ref={rootRef}
      aria-label="How our olive oil is made"
    >
      <div className="story-process__track">
        {/* THE STROKE — a wild, hand-drawn line built procedurally from the
            live step layout so it threads through every step while keeping the
            comgio character. viewBox + `d` are set in JS (buildWildPath); the
            gradient runs lime (fruit) → gold (oil). */}
        <svg
          className="story-process__spine"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="story-line-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a6ce3a" />
              <stop offset="100%" stopColor="#e6b422" />
            </linearGradient>
          </defs>
          <path className="story-process__spine-line" d="" />
        </svg>

        <div className="story-process__intro">
          <div className="story-process__title-wrap">
            <h2 className="story-process__intro-title">How it is made</h2>
            <p className="story-process__intro-eyebrow">From grove to bottle</p>
          </div>
        </div>

        <div className="story-process__steps">
          {STEPS.map((step, i) => (
            <article
              key={step.num}
              className="story-process__step"
              data-side={i % 2 === 0 ? "left" : "right"}
              data-step-index={i}
            >
              <div className="story-process__visual">
                <Image
                  className="story-process__image"
                  src={step.img}
                  alt={step.alt}
                  fill
                  sizes="(max-width: 780px) 90vw, 40vw"
                />
                <span className="story-process__placeholder-tag">
                  Placeholder
                </span>
              </div>
              <div className="story-process__text">
                <span className="story-process__num">Step {step.num}</span>
                <h3 className="story-process__step-title">{step.title}</h3>
                <p className="story-process__copy">{step.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
