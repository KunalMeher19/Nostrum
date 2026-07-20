"use client";

import { useEffect, useRef } from "react";
import "./crisp-header.css";
import { onLenis, getLenis } from "../SmoothScroll/lenisStore";
import { registerStoryScroll } from "../SmoothScroll/storyScroll";
import { hasClientNavigated } from "../RouteCurtain/curtainNav";
import LuxButton from "../LuxButton/LuxButton";
import {
  StoryParallaxOverlay,
  initStoryParallax,
} from "../StoryParallax/StoryParallax";

/* ---- Scroll-through animation (STA) config ------------------------------- */
// Frames live in /public/frames as ezgif-frame-001.jpg … ezgif-frame-240.jpg.
const STA_FRAME_COUNT = 240;
// Frame 001 is the 5th slide's still; the scrub starts one frame later so the
// hand-off from slide → canvas is seamless.
const STA_START_FRAME = 2;
// Scroll length of the pinned scrub, in viewport heights. ~238 frames over
// ~6.5vh keeps the sequence dense enough to feel filmic, with the extra ~1.5vh
// over the old 5vh giving the closing story-parallax tail (last ~14% of the
// scrub) real scroll room to rise and hand off to the Story section.
// On phones that same 6.5vh reads as an endless scroll (short viewport, no
// mouse-wheel), and the 16:9 frames are heavily cropped in portrait anyway —
// so the sequence earns less screen time. staScrollVh() shortens it on narrow
// viewports so the scrub feels tight and filmic rather than a slog.
const STA_SCROLL_VH = 3;
const STA_SCROLL_VH_MOBILE = 2;
const staScrollVh = () =>
  typeof window !== "undefined" && window.innerWidth <= 540
    ? STA_SCROLL_VH_MOBILE
    : STA_SCROLL_VH;

// ---- STA momentum -----------------------------------------------------------
// The numeric `scrub` is how many seconds ScrollTrigger takes to ease the
// pinned timeline toward the scroll position — the RESPONSIVENESS knob. A
// smaller value makes the frames chase the scroll faster: even a tiny nudge
// snaps the sequence forward quickly instead of crawling in over a long,
// laggy tail. It's time-based, so it behaves IDENTICALLY at any scroll speed.
// Crucially, smoothness no longer rides on this — the per-frame crossfade
// renderer and the shared gsap/Lenis ticker keep every sub-position AND the
// whole release tail liquid on their own — so scrub is purely "how fast do the
// frames react," not "how smooth." 0.4s reacts ~3x quicker than the previous
// 1.2s while the phase-locked ticker still glides the frames to a soft stop
// that feels the same as active scrolling. Nudge up for more drift, down for a
// tighter, more 1:1 chase.
const STA_SCRUB = 3;
const staFramePath = (i: number) =>
  `/frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

/* ---- Hero copy per slide -------------------------------------------------- */
// One {h1, sub} pair per slideshow slide, in slide order (2.png, 4.png,
// frame-001). The h1 is word-split and rises; the sub cross-fades. On every
// slide change the outgoing copy exits and the incoming slide's copy enters,
// mirroring the vertical wipe direction. Slide 0's copy is the static markup
// in the JSX below (revealed by the loader intro); the array drives the swaps.
const HERO_COPY = [
  { h1: "Not simply olive oil", sub: "Extra virgin olive oil" },
  { h1: "Liquid gold, poured", sub: "Cold-pressed, first harvest" },
  { h1: "Bottled with intent", sub: "Nostrum estate reserve" },
] as const;

/**
 * CrispHeader — a faithful 1:1 port of the Osmo "crisp" loading animation.
 * Same DOM, same CSS, same GSAP timeline (roll → scale-down → scale-up to
 * fullscreen → wordmark reveal) and the same thumbnail slideshow afterwards.
 *
 * Images are the original CDN placeholders — swap the <img src> values later.
 * GSAP + SplitText + CustomEase are imported from the npm package (free since
 * GSAP 3.13) and loaded dynamically so nothing touches window during SSR.
 */
export default function CrispHeader() {
  const rootRef = useRef<HTMLElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  // Populated by the effect once the scroll-through machine is wired. The
  // slide-0 "View our story" CTA calls this to dive down to the Story section.
  const scrollToStoryRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let split: any;
    // Cleanup handles for the scroll-through (frame preload + ScrollTrigger).
    let unsubLenis: (() => void) | null = null;
    let detachLenis: (() => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let staTrigger: any = null;
    let staCleanup: (() => void) | null = null;

    (async () => {
      const gsapMod = await import("gsap");
      const { SplitText } = await import("gsap/SplitText");
      const { CustomEase } = await import("gsap/CustomEase");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;

      const gsap = gsapMod.gsap ?? gsapMod.default;
      gsap.registerPlugin(SplitText, CustomEase, ScrollTrigger);
      CustomEase.create("slideshow-wipe", "0.625, 0.05, 0, 1");

      // On touch devices, let GSAP intercept and normalise touch-scroll so the
      // mobile address-bar expand/collapse never feeds jittery innerHeight
      // changes back into the scroll position. Lenis is NOT using syncTouch,
      // so there is no double-compensation risk here.
      //
      // IMPORTANT: normalizeScroll is toggled PER PHASE — it must be OFF during
      // the slideshow so our handleTouchMove receives raw touch events for slide
      // navigation, and ON during the STA so the pinned scrub is smooth.
      // See enterSta() / enterSlides() for the toggle calls.
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // Passive safety net: tell ScrollTrigger's own internal resize listener
      // to skip height-only changes (mobile address bar). Works in BOTH phases.
      ScrollTrigger.config({ ignoreMobileResize: true });

      // Two scroll regimes share this hero and must not fight:
      //   phase "slides" — the wheel-jack owns input; Lenis is STOPPED so the
      //                    page stays locked at scrollY 0 (the STA pin adds
      //                    ~5vh of height the instant it's created, and a live
      //                    Lenis would otherwise scroll the page out from under
      //                    the snap-slideshow after slide 1).
      //   phase "sta"    — Lenis is STARTED; scrolling scrubs the pinned frame
      //                    sequence. Entered when the user leaves slide 5 down.
      // scrollY 0 is the shared seam: STA progress 0 == frame-001 == slide 5.
      let phase: "slides" | "sta" = "slides";
      // The reverse-handoff (STA top → slideshow) must not fire the instant we
      // enter the STA: right after scrubbing up, Lenis' `direction` is still -1
      // and `scroll` is ~0, which would immediately bounce us back and re-stop
      // Lenis. So the reverse-handoff is DISARMED on entry and only ARMS once
      // the scrub has moved past this threshold.
      const STA_REARM_PX = 60;
      let staArmed = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let lenisRef: any = null;
      // Minimal imperative handle onto the slideshow, published by
      // initSlideShow. Used by the "scroll to story" action to first bring the
      // last slide (frame-001 == the STA seam) on screen so the hand-off into
      // the pinned scrub is seamless rather than a hard image cut.
      let slideshowApi: { atLast: () => boolean; toLast: () => void } | null =
        null;

      const enterSta = () => {
        if (phase === "sta") return;
        phase = "sta";
        staArmed = false;
        lenisRef?.start();
        // Enable normalizeScroll for the STA phase — GSAP intercepts touch
        // events and normalises scroll, preventing address-bar jitter.
        if (isTouchDevice) ScrollTrigger.normalizeScroll(true);
        // Hard-hide the slide-1 CTA on STA entry. It's normally already hidden
        // by transitionText on the way to the last slide, but the STA's scrubbed
        // timeline must not own it (that would flash it back on), so kill it
        // directly here — instant, and covers the reduced-motion path too.
        const ctaEl = container.querySelector<HTMLElement>(".crisp-header__cta");
        if (ctaEl) gsap.set(ctaEl, { autoAlpha: 0, pointerEvents: "none" });
        // Same for the scroll cue — it must not linger over the pinned scrub.
        const scrollCueEl =
          container.querySelector<HTMLElement>(".crisp-header__scroll");
        if (scrollCueEl) gsap.set(scrollCueEl, { autoAlpha: 0 });
        // Slide the fixed top bar (Nostrum wordmark + menu toggle) up and out
        // as the STA entry animation. CSS on .underlay-nav__header handles the
        // motion; it stays up for the whole scrub and mirrors back down when we
        // return to the slideshow (enterSlides).
        document.body.classList.add("is--sta-active");
      };
      const enterSlides = () => {
        if (phase === "slides") return;
        phase = "slides";
        // Disable normalizeScroll so touch events reach the slideshow's
        // handleTouchMove for slide navigation (normalizeScroll intercepts
        // them, which skips slides on real mobile devices).
        if (isTouchDevice) ScrollTrigger.normalizeScroll(false);
        lenisRef?.scrollTo(0, { immediate: true });
        lenisRef?.stop();
        // Snap the pinned scrub to its resolved target in THIS frame. The scrub
        // is numeric (1.2s lerp), so after Lenis stops at the top the frame
        // canvas keeps easing down for ~1s on ScrollTrigger's own ticker — the
        // STA's first frame stays stuck on screen over the slideshow until the
        // lerp finally reaches progress 0 ("later it is fixed"). Completing the
        // in-flight scrub tween and pinning the timeline to 0 resolves it at
        // once (tl.set(canvas, autoAlpha:0) lives at progress 0); hard-hide the
        // canvas too so there's no single-frame flash of the stale bitmap.
        staTrigger?.getTween?.()?.progress(1);
        staTrigger?.animation?.progress(0);
        const canvasEl = frameCanvasRef.current;
        if (canvasEl) gsap.set(canvasEl, { autoAlpha: 0 });
        document.body.classList.remove("is--sta-active");
        document.body.classList.remove("is--story-revealed");
      };

      // Sync ScrollTrigger to Lenis' interpolated scroll, and hand control back
      // to the slideshow the moment the scrub returns to the very top (frame
      // 001 == slide 5) while scrolling up — but only once it has armed.
      const onLenisScroll = (e: { scroll: number; direction: number }) => {
        ScrollTrigger.update();
        if (phase !== "sta") return;
        if (!staArmed && e.scroll > STA_REARM_PX) staArmed = true;
        if (staArmed && e.scroll <= 0.5) enterSlides();
      };
      unsubLenis = onLenis((lenis) => {
        lenisRef = lenis;
        lenis.stop(); // start life in slideshow mode — page locked at top
        lenis.on("scroll", onLenisScroll);
      });
      detachLenis = () => lenisRef?.off?.("scroll", onLenisScroll);

      // ---- Loading Animation (scoped to `container`) ----------------------
      // Loader phase is the Willem-style wordmark: NOS·[growing image]·TRUM.
      // The reveal phase that follows (slider-nav, h1 word-reveal, small text
      // fade, hand-off to the slideshow) is unchanged from the original crisp
      // build — the growing image simply reaches fullscreen where the old
      // scale-up used to, so the two phases splice together at the same beat.
      const initCrispLoadingAnimation = () => {
        // Client-side arrival (RouteCurtain navigation): the drape was the
        // loader — the hero's long cinematic intro is a FIRST-LOAD experience
        // only. Jump straight to the revealed end-state: is--loading off
        // flips the below-hero sections visible, both loader gates open, and
        // the scroll-through arms. All while still hidden under the curtain,
        // so the reveal shows a settled hero.
        if (hasClientNavigated()) {
          container.classList.remove("is--hidden");
          container.classList.remove("is--loading");
          heroRevealed = true;
          maybeInitScrollThrough();
          loaderDone = true;
          return;
        }

        const heading = container.querySelectorAll(".crisp-header__h1");
        // Willem loader parts
        const loadingLetter = container.querySelectorAll(".willem__letter");
        const box = container.querySelectorAll(".willem-loader__box");
        const growingImage = container.querySelectorAll(".willem__growing-image");
        const headingStart = container.querySelectorAll(".willem__h1-start");
        const headingEnd = container.querySelectorAll(".willem__h1-end");
        const coverImageExtra = container.querySelectorAll(
          ".willem__cover-image-extra"
        );
        // Reveal-phase parts (unchanged)
        const smallElements = container.querySelectorAll(
          ".crisp-header__top, .crisp-header__p, .crisp-header__cta, .crisp-header__scroll"
        );
        const sliderNav = container.querySelectorAll(
          ".crisp-header__slider-nav > *"
        );

        // Mirror the original vanilla-JS approach exactly:
        //
        // 1. While the section is still display:none (is--hidden), run
        //    SplitText and set yPercent:110 on the words.
        //    Because `transform: translateY(110%)` is a CSS *percentage*,
        //    the browser resolves it relative to the element's own height at
        //    **render time** — so the value is correct even though the element
        //    has no box yet.
        // 2. The GSAP timeline's onStart callback removes is--hidden.
        //    At that exact first rendered frame the heading is already
        //    translateY(110%) and sits below the SplitText overflow-hidden
        //    mask → no flash, no jump.

        if (heading.length) {
          split = new SplitText(heading, { type: "words", mask: "words" });
          gsap.set(split.words, { yPercent: 110 });
        }

        const tl = gsap.timeline({
          defaults: { ease: "expo.inOut" },
          onStart: () => {
            container.classList.remove("is--hidden");
            document.body.classList.add("is--intro-active");
          },
        });

        // --- Willem loader: letters rise, then the box+image grow between the
        //     two halves of the wordmark, then the image expands to fullscreen.
        if (loadingLetter.length) {
          tl.from(loadingLetter, {
            yPercent: 100,
            stagger: 0.025,
            duration: 1.25,
          });
        }

        if (box.length) {
          tl.fromTo(
            box,
            { width: "0em" },
            { width: "1em", duration: 1.25 },
            "< 1.25"
          );
        }

        if (growingImage.length) {
          tl.fromTo(
            growingImage,
            { width: "0%" },
            { width: "100%", duration: 1.25 },
            "<"
          );
        }

        if (headingStart.length) {
          tl.fromTo(
            headingStart,
            { x: "0em" },
            { x: "-0.05em", duration: 1.25 },
            "<"
          );
        }

        if (headingEnd.length) {
          tl.fromTo(
            headingEnd,
            { x: "0em" },
            { x: "0.05em", duration: 1.25 },
            "<"
          );
        }

        // Cycle the stacked images one by one as the wordmark splits: each
        // extra fades out to reveal the one beneath (4 → 3 → 5 → 1 → 2). The
        // stagger is tuned so the final fade lands ~as the fullscreen zoom
        // begins, leaving 2.png settled and ready to grow. (4 extras × 0.4s
        // fits the ~1.25s window before the zoom; the original 0.5s would
        // overrun it and fade the last image mid-zoom.)
        if (coverImageExtra.length) {
          tl.fromTo(
            coverImageExtra,
            { opacity: 1 },
            { opacity: 0, duration: 0.05, ease: "none", stagger: 0.4 },
            "-=0.05"
          );
        }

        // Image expands to fullscreen — the hand-off beat where the old
        // scale-up used to land, so the reveal phase below is untouched.
        if (growingImage.length) {
          tl.to(
            growingImage,
            { width: "100vw", height: "100svh", duration: 2 },
            "< 1.25"
          );
        }

        if (box.length) {
          tl.to(box, { width: "110vw", duration: 2 }, "<");
        }

        // Reveal the (now vertical, right-edge) rail: each thumb slides in from
        // off-screen right with a soft fade + slight scale, staggered top-to-
        // bottom so the column assembles downward as the hero settles.
        if (sliderNav.length) {
          tl.from(
            sliderNav,
            {
              xPercent: 140,
              opacity: 0,
              scale: 0.8,
              stagger: 0.08,
              ease: "expo.out",
              duration: 1.1,
            },
            "-=0.9"
          );
        }

        tl.call(
          () => {
            document.body.classList.remove("is--intro-active");
          },
          undefined,
          "-=0.9"
        );

        if (split && split.words.length) {
          tl.to(
            split.words,
            { yPercent: 0, stagger: 0.075, ease: "expo.out", duration: 1 },
            "< 0.1"
          );
        }

        if (smallElements.length) {
          tl.from(
            smallElements,
            { opacity: 0, ease: "power1.inOut", duration: 0.2 },
            "< 0.15"
          );
        }

        // The reveal's heavy tail is split into two beats so the main-thread
        // cost never lands on the frame the user gains control:
        //
        //  1. "+=0.05" — the intro's last tween has just settled (screen is
        //     visually still, input is still trapped by !loaderDone). Remove
        //     is--loading NOW: this flips the below-hero sections visible
        //     (full-page reflow) and arms the scroll-through, whose
        //     ScrollTrigger.refresh() must measure that fresh layout —
        //     ~200ms of synchronous layout/measure work on a low-end frame.
        //     Paying it here hides it inside the quiet beat where nothing is
        //     animating and the user can't interact yet.
        //  2. "+=0.4" — the same absolute moment the loader used to finish
        //     (0.05 + 0.4 = the original +=0.45): unlock input. Everything is
        //     already measured, so control arrives with zero jank.
        tl.call(
          function () {
            container.classList.remove("is--loading");
            // Hero is revealed — arm the scroll-through (waits on frame
            // preload too). Input stays trapped until loaderDone below.
            heroRevealed = true;
            maybeInitScrollThrough();
          },
          undefined,
          "+=0.05"
        );

        tl.call(
          function () {
            loaderDone = true;
          },
          undefined,
          "+=0.4"
        );
      };

      // ---- Slideshow (verbatim logic, scoped to `container`) ---------------
      const initSlideShow = (el: HTMLElement) => {
        const ui = {
          el,
          slides: Array.from(
            el.querySelectorAll<HTMLElement>('[data-slideshow="slide"]')
          ),
          inner: Array.from(
            el.querySelectorAll<HTMLElement>('[data-slideshow="parallax"]')
          ),
          thumbs: Array.from(
            el.querySelectorAll<HTMLElement>('[data-slideshow="thumb"]')
          ),
        };

        let current = 0;
        const length = ui.slides.length;
        let animating = false;
        // Horizontal (side-to-side) slide transition duration.
        const animationDuration = 1.2;

        ui.slides.forEach((slide, index) =>
          slide.setAttribute("data-index", String(index))
        );
        ui.thumbs.forEach((thumb, index) =>
          thumb.setAttribute("data-index", String(index))
        );

        ui.slides[current]?.classList.add("is--current");
        ui.thumbs[current]?.classList.add("is--current");

        // Hero copy that rides along with each slide. The outgoing h1 words +
        // subheading exit in the wipe direction, the text is swapped and
        // re-split, then the incoming copy enters from the opposite edge —
        // reusing the same masked word-rise + fade the loader intro uses.
        const headingEl = el.querySelector<HTMLElement>(".crisp-header__h1");
        const subEl = el.querySelector<HTMLElement>(".crisp-header__p");
        // Slide-1-only CTA pair. It exits when leaving slide 0 and returns
        // only when slide 0 is active again. pointer-events are cut while
        // hidden so the invisible buttons can't be clicked on other slides.
        const ctaEl = el.querySelector<HTMLElement>(".crisp-header__cta");
        // Slide-1-only scroll cue. Rides along with the CTA: lifts + fades out
        // when leaving slide 0 and eases back in when slide 0 is current again.
        const scrollCueEl = el.querySelector<HTMLElement>(".crisp-header__scroll");

        function transitionText(index: number, direction: number) {
          if (!headingEl) return;
          const copy = HERO_COPY[index] ?? HERO_COPY[0];
          const tl = gsap.timeline();

          // The CTAs belong to slide 0 only: fade/lift out when leaving it,
          // fade back in when it becomes current again.
          if (ctaEl) {
            if (index === 0) {
              gsap.to(ctaEl, {
                autoAlpha: 1,
                y: 0,
                ease: "power2.out",
                duration: 0.6,
                delay: 0.25,
                pointerEvents: "auto",
              });
            } else {
              gsap.to(ctaEl, {
                autoAlpha: 0,
                y: -direction * 12,
                ease: "power2.in",
                duration: 0.4,
                pointerEvents: "none",
              });
            }
          }

          // The scroll cue belongs to slide 0 only, same as the CTA: it drops
          // away in the wipe direction on exit and floats back up on return.
          if (scrollCueEl) {
            if (index === 0) {
              gsap.to(scrollCueEl, {
                autoAlpha: 1,
                y: 0,
                ease: "power2.out",
                duration: 0.6,
                delay: 0.3,
              });
            } else {
              gsap.to(scrollCueEl, {
                autoAlpha: 0,
                y: -direction * 14,
                ease: "power2.in",
                duration: 0.4,
              });
            }
          }

          // --- Exit: current words slide out of the mask, sub fades away.
          if (split && split.words && split.words.length) {
            tl.to(
              split.words,
              {
                yPercent: -direction * 110,
                stagger: 0.03,
                ease: "power2.in",
                duration: 0.5,
              },
              0
            );
          }
          if (subEl) {
            tl.to(
              subEl,
              { opacity: 0, y: -direction * 10, ease: "power2.in", duration: 0.4 },
              0
            );
          }

          // --- Swap text + re-split, primed just below/above the mask.
          tl.add(() => {
            if (split) split.revert();
            headingEl.textContent = copy.h1;
            if (subEl) subEl.textContent = copy.sub;
            split = new SplitText(headingEl, { type: "words", mask: "words" });
            gsap.set(split.words, { yPercent: direction * 110 });
            if (subEl) gsap.set(subEl, { y: direction * 10 });
          });

          // --- Enter: incoming words rise into place, sub fades back in.
          tl.add(() => {
            gsap.to(split.words, {
              yPercent: 0,
              stagger: 0.05,
              ease: "expo.out",
              duration: 0.8,
            });
            if (subEl) {
              gsap.to(subEl, {
                opacity: 1,
                y: 0,
                ease: "power2.out",
                duration: 0.6,
              });
            }
          });
        }

        function navigate(direction: number, targetIndex: number | null = null) {
          if (animating) return;
          animating = true;

          const previous = current;
          current =
            targetIndex !== null && targetIndex !== undefined
              ? targetIndex
              : direction === 1
                ? current < length - 1
                  ? current + 1
                  : 0
                : current > 0
                  ? current - 1
                  : length - 1;

          const currentSlide = ui.slides[previous];
          const currentInner = ui.inner[previous];
          const upcomingSlide = ui.slides[current];
          const upcomingInner = ui.inner[current];

          gsap
            .timeline({
              defaults: { duration: animationDuration, ease: "slideshow-wipe" },
              onStart() {
                upcomingSlide.classList.add("is--current");
                ui.thumbs[previous].classList.remove("is--current");
                ui.thumbs[current].classList.add("is--current");
                transitionText(current, direction);
              },
              onComplete() {
                currentSlide.classList.remove("is--current");
                animating = false;
              },
            })
            // Horizontal wipe: NEXT (direction 1, scroll down) sends the current
            // slide out to the LEFT while the upcoming slide enters from the
            // RIGHT; PREV reverses it (new enters from the left). Only the AXIS
            // changed from the old vertical wipe — the signs and 100/75
            // magnitudes are identical, so the parallax lag, timing and the
            // reduced-motion path all behave exactly as before, just side-to-side.
            .to(currentSlide, { xPercent: -direction * 100 }, 0)
            .to(currentInner, { xPercent: direction * 75 }, 0)
            .fromTo(
              upcomingSlide,
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

        ui.thumbs.forEach((thumb) => {
          thumb.addEventListener("click", (event) => {
            const targetIndex = parseInt(
              (event.currentTarget as HTMLElement).getAttribute("data-index") ??
              "0",
              10
            );
            if (targetIndex === current || animating) return;
            const direction = targetIndex > current ? 1 : -1;
            navigate(direction, targetIndex);
          });
        });

        // --- Scrolljacking for RR-style scene change on scroll ---
        let lastWheelTime = 0;

        const handleWheel = (e: WheelEvent) => {
          // Once handed off to the scroll-through, Lenis owns the wheel.
          if (phase === "sta") return;
          // Trap (and ignore) all scroll input until the loader has fully
          // finished revealing the hero. Otherwise an early scroll fires a
          // slide transition mid-intro and the entrance appears to "skip".
          if (!loaderDone) {
            e.preventDefault();
            return;
          }
          // Ignore horizontal scrolls
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

          const direction = e.deltaY > 0 ? 1 : -1;

          // On the last slide (frame 001), scrolling down hands off to the
          // scroll-through — but ONLY once the slide-5 rise has fully settled.
          // navigate() sets `current` synchronously at the START of a
          // transition, so without the `animating` guard a fast scroll would
          // hand off while slide 5 is still sliding up, skipping the tail of
          // that animation. Trap the scroll instead so slide 5 completes first.
          if (current === length - 1 && direction === 1) {
            e.preventDefault();
            if (!animating) enterSta();
            return;
          }
          // Release user to scroll up (bounce) if on first slide
          if (current === 0 && direction === -1) return;

          // Inside the slider bounds: trap scroll
          e.preventDefault();

          const now = Date.now();
          if (animating || now - lastWheelTime < 1200) return;

          if (Math.abs(e.deltaY) > 10) {
            navigate(direction);
            lastWheelTime = now;
          }
        };

        let touchStartY = 0;
        let isHandoffGesture = false;

        const handleTouchStart = (e: TouchEvent) => {
          isHandoffGesture = false;
          touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
          if (phase === "sta") {
            // If this is the exact swipe that triggered the transition to STA,
            // GSAP's newly-activated normalizeScroll missed the touchstart and
            // will ignore the rest of the gesture. We MUST manually preventDefault
            // here, otherwise the browser will natively scroll the remainder of
            // the swipe, which hides the mobile address bar and gets it permanently
            // stuck in the hidden state!
            if (isHandoffGesture) e.preventDefault();
            return;
          }
          // Trap all touch input until the loader intro has fully finished.
          if (!loaderDone) {
            e.preventDefault();
            return;
          }
          const touchEndY = e.touches[0].clientY;
          const deltaY = touchStartY - touchEndY;
          const direction = deltaY > 0 ? 1 : -1;

          // Hand off to the scroll-through only once slide 5 has settled.
          if (current === length - 1 && direction === 1) {
            e.preventDefault();
            if (!animating) {
              isHandoffGesture = true;
              enterSta();
            }
            return;
          }
          if (current === 0 && direction === -1) return;

          if (Math.abs(deltaY) > 10) {
            e.preventDefault(); // Trap scroll
          } else {
            return;
          }

          const now = Date.now();
          if (animating || now - lastWheelTime < 1200) return;

          if (Math.abs(deltaY) > 30) {
            navigate(direction);
            lastWheelTime = now;
            touchStartY = touchEndY;
          }
        };

        el.addEventListener("wheel", handleWheel, { passive: false });
        el.addEventListener("touchstart", handleTouchStart, { passive: false });
        el.addEventListener("touchmove", handleTouchMove, { passive: false });

        // Publish the imperative handle the "scroll to story" action uses to
        // reach the last slide (the STA seam) before diving into the scrub.
        slideshowApi = {
          atLast: () => current === length - 1,
          toLast: () => {
            if (current !== length - 1 && !animating) {
              navigate(1, length - 1);
            }
          },
        };

        return () => {
          el.removeEventListener("wheel", handleWheel);
          el.removeEventListener("touchstart", handleTouchStart);
          el.removeEventListener("touchmove", handleTouchMove);
        };
      };

      // ---- Scroll-through animation (frames 2 → 240 on scroll) -------------
      // Preloads the frame sequence during the loader, then — once BOTH the
      // loader has finished and every frame is decoded — pins the hero and
      // scrubs the canvas from frame 2 to 240 while the copy exits.
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      const frameImages: HTMLImageElement[] = new Array(STA_FRAME_COUNT + 1);
      let framesReady = false;
      // Two separate gates at the loader's tail (see the two tl.call beats):
      // heroRevealed — is--loading is off; safe to build the pinned scroll-
      //                through and pay its layout/measure cost while the
      //                screen is still quiet.
      // loaderDone   — input unlock; wheel/touch stay trapped until this so
      //                the user can't scroll mid-reveal.
      let heroRevealed = false;
      let loaderDone = false;
      let staStarted = false;
      // Set when a section-scroll request arrives before the pinned scrub
      // exists yet (still loading). initScrollThrough honours it once ready.
      let pendingSection: string | null = null;

      // ---- Scroll to a landing section ------------------------------------
      // The hero keeps Lenis stopped during the slideshow, so we can't just
      // scroll the page. Flip into the STA phase (which starts Lenis), then
      // Lenis.scrollTo the target section — Lenis animates the whole pinned
      // scrub + parallax reveal on the way down, so it reads as one cinematic
      // dive; from a section already past the hero it just eases there.
      const runSectionScroll = (selector: string) => {
        if (cancelled) return;
        const lenis = lenisRef ?? getLenis();
        const target = document.querySelector<HTMLElement>(selector);
        if (!lenis || !target) return;
        enterSta();
        lenis.scrollTo(target, {
          // Land a few px PAST each section's top so ScrollTrigger boundaries
          // (e.g. the hero pin's onLeave) fire reliably and the nav scroll-spy
          // reads the section as reached.
          offset: 8,
          duration: 2.4,
          easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
          lock: true, // ignore user scroll input mid-dive so it lands cleanly
        });
      };
      const scrollToSection = (selector: string) => {
        // Not built yet (loader still running): remember and run once ready.
        if (!staStarted) {
          pendingSection = selector;
          return;
        }
        // From the slideshow, first bring the last slide (the STA seam) on
        // screen so the frame scrub continues it seamlessly, then dive.
        if (
          phase === "slides" &&
          slideshowApi &&
          !slideshowApi.atLast()
        ) {
          slideshowApi.toLast();
          setTimeout(() => runSectionScroll(selector), 1300); // ~1.2s slide + buffer
          return;
        }
        runSectionScroll(selector);
      };

      // Smooth-scroll back up to the top hero slideshow. In the STA phase Lenis
      // is live, so it eases the whole pinned scrub back up; the moment it
      // reaches the very top, onLenisScroll's enterSlides snaps back into
      // slideshow mode (page re-locked at 0). A no-op if we're already home.
      const scrollToTop = () => {
        if (phase === "slides") return; // already at the top hero
        const lenis = lenisRef ?? getLenis();
        if (!lenis) return;
        lenis.scrollTo(0, {
          duration: 2.0,
          easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
          lock: true,
        });
      };

      scrollToStoryRef.current = () => scrollToSection("#story");
      registerStoryScroll({ toSection: scrollToSection, toTop: scrollToTop });

      const maybeInitScrollThrough = () => {
        if (staStarted || !framesReady || !heroRevealed || prefersReducedMotion) {
          return;
        }
        staStarted = true;
        initScrollThrough();
      };

      const preloadFrames = () => {
        const needed = STA_FRAME_COUNT - STA_START_FRAME + 1;
        let loaded = 0;
        const tick = () => {
          if (++loaded >= needed) {
            framesReady = true;
            maybeInitScrollThrough();
          }
        };
        for (let i = STA_START_FRAME; i <= STA_FRAME_COUNT; i++) {
          const img = new Image();
          img.decoding = "async";
          img.src = staFramePath(i);
          frameImages[i] = img;
          if (img.complete) {
            tick();
          } else {
            img.onload = tick;
            img.onerror = tick; // one 404 shouldn't stall the whole sequence
          }
        }
      };

      function initScrollThrough() {
        const canvas = frameCanvasRef.current;
        if (!canvas) return;
        const cctx = canvas.getContext("2d");
        if (!cctx) return;
        const host = container; // guarded non-null capture for this closure
        if (!host) return;

        // Capture the viewport height once — stable against the mobile
        // address-bar show/hide cycle that mutates window.innerHeight mid-
        // scroll. Updated only on real width-change resizes (orientation
        // flip, window drag). If the very first value is slightly off
        // (browser chrome still animating from a prior navigation), the
        // next real resize will correct it.
        let stableVh = window.innerHeight;

        const sizeCanvas = () => {
          // Cap DPR at 1.5, not 2. The crossfade blits TWO full-screen JPEGs per
          // frame; at 2× DPR on a retina/high-DPI display that's ~4× the pixels
          // and a paint can overrun 16ms, dropping a frame — invisible during a
          // fast drag but a visible hitch during the slow momentum tail. These
          // are soft photographic frames, so 1.5× is indistinguishable in look
          // while cutting fill cost ~45% and keeping the tail at a locked rate.
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          canvas.width = Math.round(window.innerWidth * dpr);
          canvas.height = Math.round(stableVh * dpr);
        };

        // Cover-fit blit (object-fit: cover) centred on the canvas, at `alpha`.
        // Does NOT clear — callers composite one or two frames per paint.
        const blitFrame = (index: number, alpha: number) => {
          const img = frameImages[index];
          if (!img || !img.complete || !img.naturalWidth) return;
          const cw = canvas.width;
          const ch = canvas.height;
          const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          cctx.globalAlpha = alpha;
          cctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        };

        // Opaque single-frame draw — used to prime the bitmap and on resize.
        const drawFrame = (index: number) => {
          cctx.clearRect(0, 0, canvas.width, canvas.height);
          blitFrame(index, 1);
          cctx.globalAlpha = 1;
        };

        // frameState.i is a CONTINUOUS position (e.g. 87.4), not a snapped
        // integer. renderFrame paints the sub-frame position by crossfading the
        // two bracketing frames: base frame fully opaque, the next frame layered
        // on top at alpha = fractional part. So position 87.4 = 60% frame 87 +
        // 40% frame 88 — a real in-between image. This is what makes a SLOW or
        // tiny scroll look smooth instead of snapping one whole frame at a time,
        // and it repaints every ticker frame (no integer gate), so the scrub's
        // post-scroll follow-through glides continuously to rest.
        const frameState = { i: STA_START_FRAME };
        let lastRendered = -1;
        const renderFrame = () => {
          let pos = frameState.i;
          if (pos < STA_START_FRAME) pos = STA_START_FRAME;
          else if (pos > STA_FRAME_COUNT) pos = STA_FRAME_COUNT;
          
          if (pos === lastRendered) return;
          lastRendered = pos;
          
          const baseFrame = Math.floor(pos);
          const nextFrame = Math.min(baseFrame + 1, STA_FRAME_COUNT);
          const fraction = pos - baseFrame;
          
          cctx.clearRect(0, 0, canvas.width, canvas.height);
          blitFrame(baseFrame, 1);
          
          if (fraction > 0) {
            blitFrame(nextFrame, fraction);
            // Reset alpha so other drawing operations aren't affected
            cctx.globalAlpha = 1; 
          }
        };

        sizeCanvas();
        drawFrame(STA_START_FRAME); // prime the bitmap (still hidden at progress 0)

        // Exit targets — the reverse of the post-load entrance. (The CTA is
        // handled outside this scrubbed timeline; see the note by navChildren.)
        const pEl = host.querySelector(".crisp-header__p");
        const navChildren = host.querySelectorAll(
          ".crisp-header__slider-nav > *"
        );

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: host,
            start: "top top",
            end: () => "+=" + stableVh * staScrollVh(),
            pin: true,
            pinSpacing: true,
            // Numeric scrub (vs. `true`) makes ScrollTrigger LERP the timeline
            // toward the scroll position on its own gsap ticker rather than
            // snapping 1:1. Two things fall out of this: the frame sequence is
            // smoothed while you scroll, and — because the ticker keeps easing
            // even after scroll input stops — the frames glide on for a beat and
            // ease to a soft stop instead of freezing. See STA_SCRUB for the
            // extended-momentum tuning.
            scrub: STA_SCRUB,
            invalidateOnRefresh: true,
            // UnderlayNav applies a transform to [data-main] (the pinned hero's
            // ancestor) to slide the page when the menu opens. A transformed
            // ancestor breaks position:fixed pinning, so pin via transform
            // instead — this also lets the hero ride the menu's page-slide.
            pinType: "transform",
            anticipatePin: 1,
            // Bring the fixed top bar back DOWN once the pinned scrub is fully
            // scrolled through — i.e. the Our Story parallax has landed and the
            // page releases into <StorySection/>. onLeave fires when the scroll
            // passes the pin's end (moving down, past the section); onEnterBack
            // fires when scrolling back up into the pin, hiding it again. This
            // toggles a body class the header CSS reads to glide the bar back
            // into view — is--sta-active stays on (it only clears at the very
            // top via enterSlides), so the two classes together decide the bar.
            onLeave: () => document.body.classList.add("is--story-revealed"),
            onEnterBack: () =>
              document.body.classList.remove("is--story-revealed"),
          },
        });
        staTrigger = tl.scrollTrigger;

        // Canvas is hidden at exactly progress 0 (so the wheel-jacked slides
        // 1-4, which all live at scrollY 0, are never covered) and snaps on the
        // instant the scrub starts — frame 001 sits identical underneath, so
        // there is no pop.
        tl.set(canvas, { autoAlpha: 0 }, 0);
        tl.set(canvas, { autoAlpha: 1 }, 0.0001);

        // Copy exits over the first ~22% of the scrub, mirroring how it arrived.
        // Drive the heading via a proxy that reads the *current* split.words on
        // every update: the slideshow rebuilds `split` on each slide change, so
        // capturing the words once at init would animate stale (reverted) nodes
        // and leave the live heading (e.g. slide 3's) frozen on screen. A tiny
        // per-word offset re-creates the staggered rise the entrance used.
        const wordExit = { p: 0 };
        tl.to(
          wordExit,
          {
            p: 1,
            ease: "power2.in",
            duration: 0.22,
            onUpdate() {
              const w = split && split.words ? split.words : null;
              if (!w || !w.length) return;
              const n = w.length;
              const spread = 0.35; // fraction of progress spent staggering
              for (let k = 0; k < n; k++) {
                const start = n > 1 ? (k / (n - 1)) * spread : 0;
                const local = Math.min(
                  1,
                  Math.max(0, (wordExit.p - start) / (1 - spread))
                );
                gsap.set(w[k], { yPercent: 110 * local });
              }
            },
          },
          0
        );
        if (pEl) {
          tl.to(pEl, { autoAlpha: 0, duration: 0.15 }, 0);
        }
        // NOTE: the CTA is deliberately NOT part of this scrubbed timeline.
        // The STA is only ever entered from the last slide, where the CTA is
        // already hidden (autoAlpha:0) by transitionText. Because this timeline
        // was built at init (slide 0, CTA visible), a scrubbed tween here would
        // re-assert its baked start value (autoAlpha:1) the instant the scrub
        // begins — flashing the buttons back on. enterSta() hides it directly.
        if (navChildren.length) {
          tl.to(
            navChildren,
            {
              xPercent: 140,
              autoAlpha: 0,
              scale: 0.8,
              stagger: 0.03,
              ease: "power2.in",
              duration: 0.22,
            },
            0
          );
        }

        // The frame scrub spans the entire pinned length. It only animates the
        // continuous position value; PAINTING is driven off gsap.ticker below
        // (renderFrame) so the canvas repaints every rAF, phase-locked with
        // Lenis and the scrub — identical smoothness while scrolling and during
        // the momentum tail after release.
        tl.to(
          frameState,
          { i: STA_FRAME_COUNT, duration: 1 },
          0
        );

        // Repaint on every ticker frame. renderFrame no-ops when the position
        // hasn't moved, so this is a cheap comparison while idle but guarantees
        // the canvas never falls a frame behind the scrubbed value — the tail
        // glides as smoothly as the drag instead of rendering unevenly.
        gsap.ticker.add(renderFrame);

        // Closing story-parallax: in the last ~14% of the scrub the frames keep
        // advancing to 240 while the canvas recedes + fades and the brand-colour
        // layers rise over it, landing on the "Our Story" title. Shares this
        // pinned timeline (one continuous scroll); releases into <StorySection/>.
        initStoryParallax({ gsap, tl, host, canvas });

        let lastWidth = window.innerWidth;
        const handleResize = () => {
          // On mobile, scrolling hides/shows the address bar, firing a resize
          // event. Resizing the canvas during a scrub causes a severe shake.
          // Ignore height-only resizes (width stays same) to fix the STA.
          if (window.innerWidth === lastWidth) return;
          lastWidth = window.innerWidth;
          // Real width change (orientation flip / window drag) — update the
          // stable viewport height so the pin distance and canvas match.
          stableVh = window.innerHeight;
          sizeCanvas();
          lastRendered = -1;
          renderFrame();
          // Recalc pin distances for the new layout.
          ScrollTrigger.refresh();
        };
        window.addEventListener("resize", handleResize);

        // Frames loaded after layout settled — recalc pin distances.
        ScrollTrigger.refresh();

        staCleanup = () => {
          window.removeEventListener("resize", handleResize);
          gsap.ticker.remove(renderFrame);
          tl.scrollTrigger?.kill();
          tl.kill();
        };

        // A section scroll was requested while the scrub was still loading —
        // the pin distances are now measured, so it's finally safe to dive.
        if (pendingSection) {
          const selector = pendingSection;
          pendingSection = null;
          runSectionScroll(selector);
        }
      }

      preloadFrames();

      ctx = gsap.context(() => {
        const cleanupSlideshow = initSlideShow(container);

        // Wait for the display font (Raleway) to be active before splitting
        // text. `document.fonts.ready` can resolve while `font-display: swap`
        // fonts are still mid-swap, causing SplitText to measure fallback-font
        // geometry. A subsequent font swap then reflows the heading and
        // invalidates all the word positions that GSAP has already set.
        //
        // We load the specific face we care about, then fall back to
        // document.fonts.ready if the Font Loading API doesn't support check().
        const waitForDisplayFont = async () => {
          try {
            // Try to load the exact face Next.js uses for --font-display.
            // If it's already cached the promise resolves immediately.
            await document.fonts.load("400 1em Raleway");
          } catch {
            // Swallow — font name mismatch or unsupported browser; fall through.
          }
          await document.fonts.ready;
        };

        waitForDisplayFont().then(() => {
          if (cancelled) return;
          // IMPORTANT: Because this runs asynchronously after gsap.context() has
          // already finished its synchronous execution, we MUST explicitly wrap
          // this in ctx.add() so the new timeline and tweens are tracked.
          // Otherwise, React StrictMode's cleanup won't kill the timeline on unmount.
          ctx.add(() => {
            initCrispLoadingAnimation();
          });
        });

        return () => {
          if (cleanupSlideshow) cleanupSlideshow();
        };
      }, container);
    })();

    return () => {
      cancelled = true;
      // Stop advertising the story-scroll action once this hero unmounts.
      registerStoryScroll(null);
      scrollToStoryRef.current = null;
      // Tear down the scroll-through: detach the Lenis listener, kill the
      // pinned ScrollTrigger + its timeline, and drop any pending waiter.
      detachLenis?.();
      unsubLenis?.();
      staCleanup?.();
      staTrigger?.kill?.();
      try {
        split?.revert?.();
      } catch { }
      ctx?.revert?.();
      // Reset to the initial loading state in case of dev remount.
      container.classList.add("is--loading", "is--hidden");
      document.body.classList.remove("is--intro-active");
      document.body.classList.remove("is--sta-active");
      document.body.classList.remove("is--story-revealed");
    };
  }, []);

  return (
    <section
      ref={rootRef}
      data-slideshow="wrap"
      className="crisp-header is--loading is--hidden"
    >
      <div className="crisp-header__slider">
        <div className="crisp-header__slider-list">
          <div
            data-slideshow="slide"
            className="crisp-header__slider-slide is--current"
          >
            <img
              className="crisp-header__slider-slide-inner"
              src="/images/2.png"
              alt="Close-up of glistening drop of olive oil on the rounded edge of a matte black pouring spout, lit with warm amber light."
              data-slideshow="parallax"
              draggable="false"
            />
          </div>
          <div data-slideshow="slide" className="crisp-header__slider-slide">
            <img
              className="crisp-header__slider-slide-inner"
              src="/images/4.png"
              alt="Close-up of the glossy surface of extra virgin olive oil, its golden-green ripples catching soft amber light."
              data-slideshow="parallax"
              draggable="false"
            />
          </div>
          <div data-slideshow="slide" className="crisp-header__slider-slide">
            <img
              className="crisp-header__slider-slide-inner is--frame"
              src="/frames/ezgif-frame-001.jpg"
              alt="A dark amber glass Nostrum bottle catching a single streak of warm gold light against black — the opening frame of the scroll-through reveal."
              data-slideshow="parallax"
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* Scroll-through canvas — frames 002→240 scrub over this as the hero
          pins and the copy above it fades away. Continues seamlessly from the
          frame-001 slide behind it. */}
      <canvas ref={frameCanvasRef} className="crisp-header__frames" aria-hidden="true" />

      {/* Closing transition — rises over the receding frame canvas in the last
          ~14% of the scrub and hands off to the Story section (see
          initStoryParallax, wired into the STA timeline below). */}
      <StoryParallaxOverlay />

      <div className="crisp-loader">
        <div className="willem-loader">
          <div className="willem__h1">
            <div className="willem__h1-start">
              <span className="willem__letter">N</span>
              <span className="willem__letter">o</span>
              <span className="willem__letter">s</span>
              <span className="willem__letter">t</span>
            </div>
            <div className="willem-loader__box">
              <div className="willem-loader__box-inner">
                <div className="willem__growing-image">
                  <div className="willem__growing-image-wrap">
                    <img
                      className="willem__cover-image-extra is--1"
                      src="/images/4.png"
                      loading="eager"
                      alt="Close-up of the glossy surface of extra virgin olive oil, its golden-green ripples catching soft amber light."
                    />
                    <img
                      className="willem__cover-image-extra is--2"
                      src="/images/3.png"
                      loading="eager"
                      alt="Close-up of the curved shoulder of a dark amber glass olive oil bottle, reflecting a thin streak of gold light on a black background."
                    />
                    <img
                      className="willem__cover-image-extra is--3"
                      src="/images/5.png"
                      loading="eager"
                      alt="Close-up of a silvery-green olive leaf showing its fine veins and matte texture, separated from a black background by warm gold backlight."
                    />
                    <img
                      className="willem__cover-image-extra is--4"
                      src="/images/1.png"
                      loading="eager"
                      alt="Extreme close-up of a ripe green olive, focusing on its dimpled skin texture and stem scar under warm golden light."
                    />
                    <img
                      className="willem__cover-image"
                      src="/images/2.png"
                      loading="eager"
                      alt="Close-up of glistening drop of olive oil on the rounded edge of a matte black pouring spout, lit with warm amber light."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="willem__h1-end">
              <span className="willem__letter">r</span>
              <span className="willem__letter">u</span>
              <span className="willem__letter">m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="crisp-header__content">
        <div className="crisp-header__center">
          <div className="crisp-header__title-wrap">
            <h1 className="crisp-header__h1">Not simply olive oil</h1>
            <p className="crisp-header__p">Extra virgin olive oil</p>
          </div>
        </div>
        <div className="crisp-header__bottom">
          <div className="crisp-header__slider-nav">
            <div
              data-slideshow="thumb"
              className="crisp-header__slider-nav-btn is--current"
            >
              <img
                loading="eager"
                src="/images/2.png"
                alt="Close-up of glistening drop of olive oil on the rounded edge of a matte black pouring spout, lit with warm amber light."
                className="crisp-loader__cover-img"
              />
            </div>
            <div data-slideshow="thumb" className="crisp-header__slider-nav-btn">
              <img
                loading="eager"
                src="/images/4.png"
                alt="Close-up of the glossy surface of extra virgin olive oil, its golden-green ripples catching soft amber light."
                className="crisp-loader__cover-img"
              />
            </div>
            <div data-slideshow="thumb" className="crisp-header__slider-nav-btn">
              <img
                loading="eager"
                src="/frames/ezgif-frame-001.jpg"
                alt="A dark amber glass Nostrum bottle catching a single streak of warm gold light against black — the opening frame of the scroll-through reveal."
                className="crisp-loader__cover-img is--frame"
              />
            </div>
          </div>
          {/* Slide-1-only CTAs, anchored just under the thumbnail rail on the
              bottom-right. Shown by the loader reveal, hidden on any slide
              change (and on STA entry) alongside the hero copy. */}
          <div className="crisp-header__cta">
            <LuxButton
              label="View our story"
              onClick={() => scrollToStoryRef.current?.()}
            />
            <LuxButton label="Explore products" href="/products" />
          </div>
        </div>

        {/* Scroll cue — a thin gold comet travelling a hairline rail, under a
            wide-tracked "Scroll" label. Slide-0 only: it fades in with the
            loader reveal (part of the smallElements group) and lifts/fades out
            on any slide change or STA entry, mirroring the CTA. */}
        <div className="crisp-header__scroll" aria-hidden="true">
          <span className="crisp-header__scroll-label">Scroll</span>
          <span className="crisp-header__scroll-line">
            <span className="crisp-header__scroll-comet" />
          </span>
        </div>
      </div>
    </section>
  );
}
