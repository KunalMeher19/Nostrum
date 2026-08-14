"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import "./story-process.css";
import { useLocale } from "../LocaleContext/LocaleContext";
import type { ProcessStepImage } from "@/lib/api";

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
  const ampMin = mobile ? 0.12 : 0.12;
  const ampMax = mobile ? 0.22 : 0.22;
  const ampK = mobile ? 0.4 : 0.4;

  // Client feedback 2.0: "Put a straight line" — the underline is ONE dead
  // straight stroke, no return loop. Left → right, then a single smooth
  // vertical-tangent plunge down into the first step.
  let d = `M ${f(a0.x - 90)} ${f(a0.y)}`;
  // The straight underline.
  d += ` L ${f(a0.x + 90)} ${f(a0.y)}`;
  // Exit: leaves the underline horizontally from its right end, turns once,
  // and arrives at the first node vertically (matching the leg joins below),
  // so no kinked angle.
  d += ` C ${f(a0.x + 150)} ${f(a0.y)}, ${f(a1.x)} ${f(a1.y - (a1.y - a0.y) * 0.55)}, ${f(a1.x)} ${f(a1.y)}`;

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
  const tailLen = W <= 540 ? 50 : 100;
  const endY = Math.min(last.y + tailLen, H);
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
    title: "process.step1_title",
    copy: "process.step1_copy",
    img: "/images/1.png",
    alt: "Ripe olives on the branch",
  },
  {
    num: "02",
    title: "process.step2_title",
    copy: "process.step2_copy",
    img: "/images/5.png",
    alt: "Olive leaves and fruit",
  },
  {
    num: "03",
    title: "process.step3_title",
    copy: "process.step3_copy",
    img: "/images/4.png",
    alt: "Olive oil surface",
  },
  {
    num: "04",
    title: "process.step4_title",
    copy: "process.step4_copy",
    img: "/images/2.png",
    alt: "Oil drawn from the press",
  },
  {
    num: "05",
    title: "process.step5_title",
    copy: "process.step5_copy",
    img: "/images/3.png",
    alt: "Bottle shoulder reflection",
  },
];

export default function StoryProcess({
  stepImages,
}: {
  /** Admin-curated overrides (Content tab); falls back to the built-in
      placeholder stills per step when absent. */
  stepImages?: ProcessStepImage[];
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const { t } = useLocale();

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
    const stepsContainer = root.querySelector<HTMLElement>(".story-process__steps");

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
      // step.offsetTop is relative to .story-process__steps (position:relative),
      // not the track. Add the steps container's own offsetTop so node y-values
      // are in track-relative coordinates matching the SVG viewBox.
      const stepsBaseY = stepsContainer?.offsetTop ?? 0;
      steps.forEach((step) => {
        const side = step.dataset.side === "right" ? 0.6 : 0.4;
        nodes.push({ x: W * side, y: stepsBaseY + step.offsetTop + step.offsetHeight / 2 });
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
      // The gradient is userSpaceOnUse (see the JSX note) — its vertical span
      // must follow the viewBox height or the lime→gold ramp drifts.
      const grad = svg.querySelector("#story-line-grad");
      grad?.setAttribute("y2", `${H}`);
      const d = buildWildPath(computeNodes(W), W, H);
      if (d === sampledD) {
        // Even if geometry string didn't change (e.g., nodes didn't move),
        // track height (H) might have changed due to padding/viewport resizes.
        // We MUST update the viewBox, or the SVG will be vertically squished.
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        return total; // geometry unchanged — reuse samples
      }
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
        // ---- 1. THE STROKE — tip pinned to a fixed viewport line ---------
        // Was a scrubbed tween across a pre-measured scroll range (start
        // "top 55%" → last step "center 80%"). Brave resolved those measured
        // positions differently from Chrome (different chrome/viewport math),
        // so the draw lagged behind scroll and never reached step 05. Now the
        // mapping is calibration-free: each scroll frame reads the track's
        // LIVE on-screen position (getBoundingClientRect) and draws the
        // stroke up to where the path crosses the tip-line at 75% of the
        // viewport height. The tip is defined by what is on screen — immune
        // to browser chrome, hero pin spacing and stale refresh measurements.
        const TIP_AT = 0.75; // the tip rides this fraction down the viewport
        const targetP = (): number => {
          if (!track || ySamples.length < 2) return 0;
          const rect = track.getBoundingClientRect();
          // viewport tip-line converted into track px (== viewBox units).
          const tipY = window.innerHeight * TIP_AT - rect.top;
          const y0 = ySamples[0].y;
          const y1 = ySamples[ySamples.length - 1].y;
          if (y1 <= y0) return 0;
          return Math.min(1, Math.max(0, (tipY - y0) / (y1 - y0)));
        };
        const applyDraw = () => {
          line.style.strokeDashoffset = `${total - drawnLen()}`;
        };
        // Short chase tween ≈ the old scrub-0.5 momentum feel.
        const chase = gsap.quickTo(draw, "p", {
          duration: 0.45,
          ease: "power3",
          onUpdate: applyDraw,
        });
        ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          invalidateOnRefresh: true,
          // Measured after the hero's pin above (default priority 0) so the
          // active window includes the pin spacing — see the reveals below.
          refreshPriority: -1,
          // Rebuild the path whenever ScrollTrigger recomputes (resize / the
          // display:none→visible flip after the hero loader), so it always
          // matches the current step layout. Jump (no chase) to the correct
          // draw state for the new layout.
          onRefresh: () => {
            paintPath();
            draw.p = targetP();
            gsap.set(line, { strokeDasharray: total });
            applyDraw();
          },
          onUpdate: () => chase(targetP()),
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
      aria-label={t("process.aria")}
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
            {/* userSpaceOnUse so the lime→gold ramp spans the TRACK, not the
                path's own bbox — steadier under path rebuilds. y2 is kept in
                sync with the track height by paintPath. */}
            <linearGradient
              id="story-line-grad"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#a6ce3a" />
              <stop offset="100%" stopColor="#e6b422" />
            </linearGradient>
          </defs>
          <path className="story-process__spine-line" d="" />
        </svg>

        <div className="story-process__intro">
          <div className="story-process__title-wrap">
            <h2 className="story-process__intro-title">{t("process.title")}</h2>
            <p className="story-process__intro-eyebrow">{t("process.eyebrow")}</p>
          </div>
        </div>

        <div className="story-process__steps">
          {STEPS.map((step, i) => {
            const override = stepImages?.[i];
            const overrideUrl = override?.url?.trim();
            const custom = Boolean(overrideUrl);
            const imgSrc = overrideUrl || step.img;
            const imgAlt = override?.alt?.trim() || step.alt;
            return (
            <article
              key={step.num}
              className="story-process__step"
              data-side={i % 2 === 0 ? "left" : "right"}
              data-step-index={i}
            >
              <div className="story-process__visual">
                <Image
                  className="story-process__image"
                  src={imgSrc}
                  alt={imgAlt}
                  fill
                  sizes="(max-width: 780px) 90vw, 40vw"
                />
                {!custom && (
                  <span className="story-process__placeholder-tag">
                    Placeholder
                  </span>
                )}
              </div>
              <div className="story-process__text">
                <span className="story-process__num">
                  {t("process.step")} {step.num}
                </span>
                <h3 className="story-process__step-title">{t(step.title)}</h3>
                <p className="story-process__copy">{t(step.copy)}</p>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
