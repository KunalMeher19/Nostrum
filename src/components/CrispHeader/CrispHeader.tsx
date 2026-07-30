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
import { useLocale } from "../LocaleContext/LocaleContext";

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
// ---- STA kill-switch (client feedback 1.0, 2026-07) -------------------------
// The client asked to DELETE the bottle scroll-animation from the home page —
// the pinned 240-frame scrub made moving around the site take too long, and
// the bottle isn't their real product. The whole STA machine (preload, canvas,
// pinned ScrollTrigger, story-parallax tail) is kept intact behind this flag
// so it can be reused elsewhere later; with it off the hero releases into
// plain page scroll after the last slide and the "Our Story" beat lives in
// the normal-flow <StoryIntro/> section below the hero instead.
const STA_ENABLED: boolean = false;
const staFramePath = (i: number) =>
  `/frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

/* ---- Hero copy per slide -------------------------------------------------- */
// One {h1, sub} pair per slideshow slide, in slide order (2.png, 4.png,
// frame-001). The h1 is word-split and rises; the sub cross-fades. On every
// slide change the outgoing copy exits and the incoming slide's copy enters,
// mirroring the vertical wipe direction. Slide 0's copy is the static markup
// in the JSX below (revealed by the loader intro); the array drives the swaps.
// i18n keys per slide — resolved via t() inside the component so each locale
// gets its own copy. (A locale switch remounts the page, so the GSAP effect
// re-captures the resolved strings on every language change.)
const HERO_KEYS = [
  { h1: "hero.slide0_h1", sub: "hero.slide0_sub" },
  { h1: "hero.slide1_h1", sub: "hero.slide1_sub" },
  { h1: "hero.slide2_h1", sub: "hero.slide2_sub" },
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

  // Localized hero copy. A locale switch is a route navigation that remounts
  // this component, so the effect below re-captures the fresh strings — a ref
  // isn't needed.
  const { t, locale } = useLocale();
  const heroCopy = HERO_KEYS.map((k) => ({ h1: t(k.h1), sub: t(k.sub) }));

  // Longer languages (ES/CA/IT) blow the display size out of the viewport —
  // scale the hero type down proportionally to the longest headline, using
  // the English "Not simply olive oil" (~21 chars) as the size=1 reference.
  // Clamped at 0.62 so it never becomes timid; below-reference stays 1.
  const longestH1 = Math.max(...heroCopy.map((c) => c.h1.length));
  const heroScale = Math.max(0.62, Math.min(1, 21 / longestH1));

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
      // Fraction of the pin distance below which the fixed top bar returns
      // while scrolling UP. The bar used to come back only at absolute 0
      // (enterSlides), but Lenis' deceleration means the last few hundred px
      // crawl — the 3rd slide is visually back long before scroll numerically
      // hits 0, and the bar looked stuck. Matching the parallax-start boundary
      // (layers fully gone below it) brings the bar down in step with the
      // slide's return; scrolling down past it hides the bar again.
      const NAV_RETURN_FRACTION = 0.15;
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
        // Hide hero text elements (h1 words + subtitle) and slider nav
        // thumbnails. The scrubbed timeline in initStoryPin normally animates
        // these away over the first ~22% of the pin. But when entering STA
        // from a back-navigation with the page already scrolled past the hero,
        // the scrub is already past that point and the elements stay stuck on
        // screen. In that case, hide them immediately so they don't overlap
        // the frame canvas / story section.
        //
        // At scroll position ≈ 0 (normal slideshow → STA handoff), SKIP the
        // instant hide so the scrubbed timeline's staggered exit animation
        // plays visibly — the user sees the thumbnails, heading words and
        // subtitle animate out as they scroll into the pin.
        const alreadyScrolled = window.scrollY > 10;
        if (alreadyScrolled) {
          if (split && split.words && split.words.length) {
            gsap.set(split.words, { yPercent: 110 });
          }
          const heroSubEl = container.querySelector<HTMLElement>(".crisp-header__p");
          if (heroSubEl) gsap.set(heroSubEl, { autoAlpha: 0 });
          const sliderNavItems = container.querySelectorAll(
            ".crisp-header__slider-nav > *"
          );
          if (sliderNavItems.length) {
            gsap.set(sliderNavItems, { xPercent: 140, autoAlpha: 0, scale: 0.8 });
          }
        }
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
        // Restore hero text elements that enterSta() hid. The slideshow needs
        // them visible to display the current slide's copy.
        if (split && split.words && split.words.length) {
          gsap.set(split.words, { yPercent: 0 });
        }
        const heroSubEl = container.querySelector<HTMLElement>(".crisp-header__p");
        if (heroSubEl) gsap.set(heroSubEl, { autoAlpha: 1 });
        const ctaEl = container.querySelector<HTMLElement>(".crisp-header__cta");
        if (ctaEl) gsap.set(ctaEl, { autoAlpha: 1, pointerEvents: "auto" });
        const scrollCueEl = container.querySelector<HTMLElement>(".crisp-header__scroll");
        if (scrollCueEl) gsap.set(scrollCueEl, { autoAlpha: 1 });
        const sliderNavItems = container.querySelectorAll(
          ".crisp-header__slider-nav > *"
        );
        if (sliderNavItems.length) {
          gsap.set(sliderNavItems, { xPercent: 0, autoAlpha: 1, scale: 1 });
        }
      };

      // Sync ScrollTrigger to Lenis' interpolated scroll, and hand control back
      // to the slideshow the moment the scrub returns to the very top (frame
      // 001 == slide 5) while scrolling up — but only once it has armed.
      const onLenisScroll = (e: { scroll: number; direction: number }) => {
        ScrollTrigger.update();
        if (phase !== "sta") return;
        if (!staArmed && e.scroll > STA_REARM_PX) staArmed = true;
        if (staArmed && e.scroll <= 0.5) enterSlides();
        // Glide the fixed top bar back down as soon as the scrub drops below
        // the parallax boundary on the way up (the 3rd slide is back on
        // screen there), instead of waiting for the crawl to absolute 0.
        // Uses the pinned trigger's live start/end so it survives refreshes.
        if (phase === "sta" && staTrigger) {
          const pinLen = (staTrigger.end as number) - (staTrigger.start as number);
          if (pinLen > 0) {
            const progress =
              (e.scroll - (staTrigger.start as number)) / pinLen;
            document.body.classList.toggle(
              "is--sta-active",
              progress >= NAV_RETURN_FRACTION
            );
          }
        }
      };

      // Handle native scroll changes (e.g., Next.js scroll restoration on Back button)
      // If the page is scrolled down (past the top hero), ensure we are in STA mode
      // so Lenis is started and scrolling works.
      const onNativeScroll = () => {
        if (phase === "slides" && window.scrollY > 10) {
          enterSta();
        }
      };

      unsubLenis = onLenis((lenis) => {
        lenisRef = lenis;

        // If we load and we're already scrolled down (or have a hash), start in STA mode
        if (window.scrollY > 10 || window.location.hash) {
          enterSta();
        } else {
          lenis.stop(); // start life in slideshow mode — page locked at top
        }

        lenis.on("scroll", onLenisScroll);
        window.addEventListener("scroll", onNativeScroll, { passive: true });
      });
      detachLenis = () => {
        lenisRef?.off?.("scroll", onLenisScroll);
        window.removeEventListener("scroll", onNativeScroll);
      };

      // ---- Loading Animation (scoped to `container`) ----------------------
      // Loader phase (client feedback 1.0): a single tracked-out "NOSTRUM"
      // wordmark over the warm load glow — masked letters rise in with a
      // stagger while the tracking breathes open (pensioperello-style, text
      // only), hold a beat, then lift away as the first slide fades in
      // underneath. The reveal phase that follows (slider-nav, h1 word-reveal,
      // small text fade, hand-off to the slideshow) is unchanged.
      const initCrispLoadingAnimation = () => {
        // Client-side arrival (RouteCurtain navigation): the drape was the
        // loader — the hero's long cinematic intro is a FIRST-LOAD experience
        // only. Jump straight to the revealed end-state: is--loading off
        // flips the below-hero sections visible, both loader gates open, and
        // the scroll-through arms. All while still hidden under the curtain,
        // so the reveal shows a settled hero.
        if (hasClientNavigated()) {
          // The intro is skipped, but the split MUST still exist: enterSta(),
          // enterSlides() and the STA scrub's word-exit all drive the heading
          // through `split.words` and silently no-op without it — on a
          // back-navigation restored mid-scroll that left the raw h1 painted
          // over the frame canvas.
          const heading = container.querySelectorAll(".crisp-header__h1");
          if (heading.length && !split) {
            split = new SplitText(heading, { type: "words", mask: "words" });
          }
          // A back/forward restore runs the mount-time enterSta() BEFORE this
          // (fonts not ready yet), when the split didn't exist — re-apply the
          // STA hidden state now that it does.
          if (phase === "sta" && split && split.words && split.words.length) {
            gsap.set(split.words, { yPercent: 110 });
          }
          container.classList.remove("is--hidden");
          container.classList.remove("is--loading");
          heroRevealed = true;
          maybeInitScrollThrough();
          loaderDone = true;
          return;
        }

        const heading = container.querySelectorAll(".crisp-header__h1");
        // Simple-loader parts — the tracked-out NOSTRUM letters.
        const loadingLetter = container.querySelectorAll(".nostrum-loader__letter");
        const loaderMark = container.querySelector<HTMLElement>(".nostrum-loader__mark");
        // The slideshow layer — crossfaded in from the glow at the hand-off.
        const sliderEl = container.querySelectorAll(".crisp-header__slider");
        // Reveal-phase parts (unchanged)
        const smallElements = container.querySelectorAll(
          ".crisp-header__top, .crisp-header__p, .crisp-header__cta, .crisp-header__scroll"
        );
        const sliderNav = container.querySelectorAll(
          ".crisp-header__slider-nav > *"
        );

        // Mirror the original vanilla-JS approach exactly:
        //
        // 1. While the section is still display:none (is--hidden), set
        //    yPercent:110 on the masked letters.
        //    Because `transform: translateY(110%)` is a CSS *percentage*,
        //    the browser resolves it relative to the element's own height at
        //    **render time** — so the value is correct even though the element
        //    has no box yet.
        // 2. The GSAP timeline's onStart callback removes is--hidden.
        //    At that exact first rendered frame the letters are already
        //    translateY(110%) below their overflow-hidden masks → no flash.

        if (heading.length) {
          split = new SplitText(heading, { type: "words", mask: "words" });
          gsap.set(split.words, { yPercent: 110 });
        }

        // Hold the hero's other UI hidden for the whole loading phase. The old
        // reveal used `.from()` tweens whose immediateRender hid these; the
        // curtain-out reveal settles them in a single `tl.call` under the drape
        // instead, so nothing hides them up front — without this they bleed
        // through the loader (subtitle, SCROLL cue, CTAs, thumb rail). The
        // slider itself is already display:none via .is--loading CSS.
        if (smallElements.length) gsap.set(smallElements, { autoAlpha: 0 });
        if (sliderNav.length) gsap.set(sliderNav, { autoAlpha: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "expo.inOut" },
          onStart: () => {
            container.classList.remove("is--hidden");
            document.body.classList.add("is--intro-active");
          },
        });

        // --- Simple loader: masked letters rise in with a stagger while the
        //     wordmark's tracking breathes open — text only, over the glow.
        if (loadingLetter.length) {
          tl.from(loadingLetter, {
            yPercent: 110,
            autoAlpha: 0,
            stagger: 0.055,
            ease: "expo.out",
            duration: 1.3,
          });
        }
        if (loaderMark) {
          tl.fromTo(
            loaderMark,
            { letterSpacing: "0.18em" },
            { letterSpacing: "0.42em", ease: "power2.out", duration: 2.1 },
            0
          );
        }

        // Hold a quiet beat on the settled wordmark, then lift it away —
        // letters exit upward through their masks in the same order they came.
        if (loadingLetter.length) {
          tl.to(
            loadingLetter,
            {
              yPercent: -110,
              autoAlpha: 0,
              stagger: 0.035,
              ease: "expo.in",
              duration: 0.8,
            },
            "+=0.55"
          );
        }

        // The whole loading layer (wordmark + glow + corner light + sparkles)
        // is clipped by this path so it can be swept off the TOP like an
        // upward-lifting curtain instead of a flat crossfade.
        const loaderClip = container.querySelector<SVGPathElement>(
          "[data-loader-clip]"
        );

        // Settle the hero UNDERNEATH the still-full curtain — same end-state a
        // client-side curtain navigation lands on: slider live, rail assembled,
        // heading words up, small text in. is--loading drops (full-page reflow,
        // scroll-through arms) and is--sweeping takes over so the loader keeps
        // painting while the drape lifts. All hidden under the curtain, so the
        // reveal shows a fully settled hero — never a mid-animation frame.
        tl.call(
          function () {
            if (sliderEl.length) gsap.set(sliderEl, { autoAlpha: 1 });
            if (sliderNav.length)
              gsap.set(sliderNav, { autoAlpha: 1, xPercent: 0, scale: 1 });
            if (split && split.words.length)
              gsap.set(split.words, { yPercent: 0 });
            if (smallElements.length) gsap.set(smallElements, { autoAlpha: 1 });
            container.classList.remove("is--loading");
            container.classList.add("is--sweeping");
            heroRevealed = true;
            maybeInitScrollThrough();
            document.body.classList.remove("is--intro-active");
          },
          undefined,
          "+=0.05"
        );

        // ---- Curtain-out sweep — same drape math + timing/easing as
        //      RouteCurtain.closeCurtain, normalised to the clip's
        //      objectBoundingBox (0–1), but re-anchored to the TOP edge so the
        //      loader lifts UPWARD (area ABOVE the curve is curtain). yEdge
        //      starts full (1) and travels past 0 to a negative EXIT; as it
        //      passes the top the loader clears the viewport and the hero shows.
        //      The mid control point leads past the corners then settles back —
        //      the sag that reads as cloth rather than a flat wipe.
        if (loaderClip) {
          const drape = { yEdge: 1, yMid: 1 };
          const drawSweep = () =>
            loaderClip.setAttribute(
              "d",
              `M0,0 L1,0 L1,${drape.yEdge} Q0.5,${drape.yMid} 0,${drape.yEdge} Z`
            );
          drawSweep();
          const EXIT = -0.18; // past the top edge — mirror of RouteCurtain EXIT/100
          tl.to(
            drape,
            { yEdge: EXIT, duration: 0.95, ease: "power3.inOut", onUpdate: drawSweep },
            "+=0.05"
          )
            .to(
              drape,
              { yMid: EXIT - 0.25, duration: 0.55, ease: "power2.in", onUpdate: drawSweep },
              "<"
            )
            .to(
              drape,
              { yMid: EXIT, duration: 0.4, ease: "power2.out", onUpdate: drawSweep },
              "<0.55"
            );
        }

        tl.call(function () {
          // Curtain has cleared the viewport — retire the loader layer.
          container.classList.remove("is--sweeping");
          loaderDone = true;
        });
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
        // Set when the user scrolls down on the last slide WHILE its entrance
        // transition is still running. Instead of silently eating that gesture
        // (which forced a second scroll to actually enter the story pin), the
        // intent is remembered and enterSta() fires the moment the transition
        // completes — the hand-off feels immediate even on a fast scroll-through.
        let pendingSta = false;
        // True while the current animation is navigating FROM a non-last slide
        // TO the last slide. During this window, wheel/touch events with
        // direction === 1 are residual inertia from the gesture that initiated
        // the navigation — NOT intentional "scroll past the last slide"
        // requests. Without this guard, `current` (already set to length-1)
        // tricks handleWheel into setting pendingSta from inertia, which
        // auto-fires enterSta() on animation complete.
        let navigatingToLast = false;
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
          const copy = heroCopy[index] ?? heroCopy[0];
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

          // Track whether this animation is heading TO the last slide from a
          // different slide. Wheel/touch handlers use this to ignore inertia
          // events that would otherwise set pendingSta.
          navigatingToLast =
            previous !== length - 1 && current === length - 1;

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
                navigatingToLast = false;
                // Honour a hand-off gesture that arrived mid-transition: the
                // last slide has now fully settled, so dive into the pin.
                if (pendingSta && current === length - 1 && phase === "slides") {
                  pendingSta = false;
                  enterSta();
                } else {
                  pendingSta = false;
                }
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
          // Any upward gesture cancels a queued hand-off — the user changed
          // their mind mid-transition.
          if (direction === -1) pendingSta = false;
          if (current === length - 1 && direction === 1) {
            if (animating) {
              // If we're mid-transition TO the last slide, these wheel events
              // are residual inertia from the gesture that triggered the
              // navigation — swallow them but do NOT set pendingSta.
              if (navigatingToLast) {
                e.preventDefault();
                return;
              }
              // Already ON the last slide and it's still settling — remember
              // the intent so onComplete fires enterSta() the moment it lands.
              pendingSta = true;
              e.preventDefault();
              return;
            }
            enterSta();
            // Deliberately NO preventDefault here: enterSta() has already
            // started Lenis synchronously, so this SAME wheel event bubbles up
            // to Lenis' own wheel listener and becomes the first scroll of the
            // pinned scrub. Before, the event was swallowed — the first
            // gesture only flipped the phase and the page didn't move until
            // the SECOND scroll, which read as a dead delay at the hand-off.
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

          // Hand off to the scroll-through only once slide 5 has settled;
          // remember a mid-transition swipe (same pendingSta as the wheel path).
          if (current === length - 1 && direction === 1) {
            e.preventDefault();
            if (!animating) {
              isHandoffGesture = true;
              enterSta();
            } else if (!navigatingToLast) {
              // Only queue the STA hand-off if we were already on the last
              // slide — not if we're mid-transition TO it (inertia guard).
              pendingSta = true;
            }
            return;
          }
          if (direction === -1) pendingSta = false;
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
        // enterSta() no-ops when the phase is already "sta" (e.g. clicking a
        // nav link while scrolled to a section), but the open menu's scroll
        // lock has STOPPED Lenis — and a stopped Lenis silently drops
        // scrollTo. Start it explicitly so the dive always runs; the menu's
        // own unlock-on-close is then a harmless re-start.
        lenis.start();
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
        // Same as runSectionScroll: the open menu's scroll lock stops Lenis,
        // and a stopped Lenis drops scrollTo — start it before the ride up.
        lenis.start();
        lenis.scrollTo(0, {
          duration: 2.0,
          easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
          lock: true,
        });
      };

      scrollToStoryRef.current = () => scrollToSection("#story");
      registerStoryScroll({ toSection: scrollToSection, toTop: scrollToTop });

      const maybeInitScrollThrough = () => {
        // STA disabled (no frame scrub): the pinned hand-off still exists —
        // it's the story pin riding the last SLIDE (initStoryPin) — it just
        // doesn't wait on any frame preload.
        if (!STA_ENABLED) {
          if (staStarted || !heroRevealed || prefersReducedMotion) return;
          staStarted = true;
          initStoryPin();
          return;
        }
        if (staStarted || !framesReady || !heroRevealed || prefersReducedMotion) {
          return;
        }
        staStarted = true;
        initScrollThrough();
      };

      const preloadFrames = () => {
        if (!STA_ENABLED) return; // no scrub → don't fetch 239 frames
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

      // ---- Story pin (STA disabled) ---------------------------------------
      // The pinned "Our Story" hand-off, rebuilt on the SLIDESHOW itself.
      // Client feedback 1.0 deleted the 240-frame bottle scrub, but the
      // closing parallax the client liked stays: entering the pin from the
      // last slide, the hero copy exits exactly as before, the SLIDE pane
      // recedes + fades exactly as the frame canvas used to (same tween, new
      // subject — see initStoryParallax's `canvas` arg), and the brand-colour
      // layers rise over it, landing on "Our Story" before the pin releases
      // into <StorySection/>. Much shorter than the old 3vh frame scrub, so
      // moving around stays quick.
      // 1.8vh (was 1) — the old 1vh pin was short enough that a fast flick
      // blew straight past it while the scrub-3 lerp was still catching up,
      // so the whole parallax played AFTER the page had already released into
      // <StorySection/> (i.e. you missed it). 1.8vh gives the tail real
      // scroll room: even a hard flick spends enough distance inside the pin
      // that the rise is always on screen. Passing through takes ~2x the
      // scrolling — deliberate, per "longer + cinematic" direction.
      const STORY_PIN_VH = 1.8;
      const STORY_PIN_VH_MOBILE = 1.4;
      const storyPinVh = () =>
        window.innerWidth <= 540 ? STORY_PIN_VH_MOBILE : STORY_PIN_VH;
      // Where in the pin (0 → 1) the parallax tail begins. 0.15 (was 0.3):
      // the old 30% dead zone meant ~2-3 wheel notches of "nothing but the
      // copy exit" before the layers even started — the perceived delay on
      // entry. Now the slide recede + layer rise kick in on the first
      // gesture, overlapping the tail of the copy exit (first ~22%).
      const STORY_PIN_PARALLAX_START = 0.15;

      function initStoryPin() {
        const host = container;
        if (!host) return;
        const sliderPane = host.querySelector<HTMLElement>(
          ".crisp-header__slider"
        );
        if (!sliderPane) return;

        // Stable viewport height — same mobile address-bar guard as the STA.
        let stableVh = window.innerHeight;

        const pEl = host.querySelector(".crisp-header__p");
        const navChildren = host.querySelectorAll(
          ".crisp-header__slider-nav > *"
        );

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: host,
            start: "top top",
            end: () => "+=" + stableVh * storyPinVh(),
            pin: true,
            pinSpacing: true,
            scrub: STA_SCRUB,
            invalidateOnRefresh: true,
            // Same pinType rationale as the STA: UnderlayNav transforms
            // [data-main], which breaks position:fixed pinning.
            pinType: "transform",
            anticipatePin: 1,
            onLeave: () => document.body.classList.add("is--story-revealed"),
            onEnterBack: () =>
              document.body.classList.remove("is--story-revealed"),
          },
        });
        staTrigger = tl.scrollTrigger;

        // Span the timeline to duration 1 so initStoryParallax's fractional
        // `start` positions land as fractions of the whole pin (the old frame
        // tween used to provide this span).
        tl.to({}, { duration: 1 }, 0);

        // Copy exits over the first ~22% of the pin — identical proxy to the
        // old STA scrub (reads the CURRENT split.words every update, since the
        // slideshow rebuilds `split` on each slide change).
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
              const spread = 0.35;
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

        // The closing parallax — the exact tail the client approved, with the
        // slideshow pane as the receding subject instead of the frame canvas.
        // hideSlider MUST be false: the pane IS the subject here.
        initStoryParallax({
          gsap,
          tl,
          host,
          canvas: sliderPane,
          start: STORY_PIN_PARALLAX_START,
          hideSlider: false,
        });

        let lastWidth = window.innerWidth;
        const handleResize = () => {
          // Ignore height-only resizes (mobile address bar) — same guard as
          // the STA's resize handler.
          if (window.innerWidth === lastWidth) return;
          lastWidth = window.innerWidth;
          stableVh = window.innerHeight;
          ScrollTrigger.refresh();
        };
        window.addEventListener("resize", handleResize);

        // Sections became visible on the same beat this ran — measure now.
        ScrollTrigger.refresh();

        staCleanup = () => {
          window.removeEventListener("resize", handleResize);
          tl.scrollTrigger?.kill();
          tl.kill();
        };

        // A section scroll was requested while the loader was still running —
        // the pin distances are now measured, so it's safe to dive.
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
      style={{ "--hero-scale": heroScale } as React.CSSProperties}
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
              alt="A dark amber glass Nostrum bottle catching a single streak of warm gold light against black, the opening frame of the scroll-through reveal."
              data-slideshow="parallax"
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* Scroll-through canvas — STA-only, kept behind the flag for reuse
          elsewhere (client feedback 1.0 removed the pinned bottle scrub). */}
      {STA_ENABLED && (
        <canvas
          ref={frameCanvasRef}
          className="crisp-header__frames"
          aria-hidden="true"
        />
      )}

      {/* Closing transition — rises over the receding subject in the pin's
          tail and hands off to the Story section. Subject = frame canvas when
          the STA is on, the slideshow pane otherwise (see initStoryPin). */}
      <StoryParallaxOverlay />

      {/* The whole loading layer is clipped by an animated SVG path so it can
          sweep off the bottom exactly like the RouteCurtain "curtain-out"
          reveal (same quadratic drape + timing/easing) instead of a flat fade.
          data-loader-clip's `d` is driven by the intro timeline. */}
      <svg className="crisp-loader__clip-svg" aria-hidden="true">
        <defs>
          <clipPath id="crisp-loader-clip" clipPathUnits="objectBoundingBox">
            <path data-loader-clip d="M0,0 L1,0 L1,1 L0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="crisp-loader">
        {/* Bottom-right golden light — the same warm corner glow the route
            curtain carries, so the load screen and the drape read as one
            continuous surface. Swept away with the curtain on reveal. */}
        {/* <div className="crisp-loader__corner-light" aria-hidden="true" /> */}

        {/* Gold sparkles — faint twinkling motes clustered toward the warm
            corner, matching RouteCurtain. Staggered CSS twinkle. */}
        <div className="crisp-loader__sparkles" aria-hidden="true">
          <span className="crisp-loader__spark" style={{ top: "62%", left: "78%", ["--d" as string]: "0s" }} />
          <span className="crisp-loader__spark" style={{ top: "74%", left: "88%", ["--d" as string]: "0.9s" }} />
          <span className="crisp-loader__spark" style={{ top: "83%", left: "70%", ["--d" as string]: "1.6s" }} />
          <span className="crisp-loader__spark" style={{ top: "55%", left: "90%", ["--d" as string]: "0.4s" }} />
          <span className="crisp-loader__spark" style={{ top: "90%", left: "84%", ["--d" as string]: "2.1s" }} />
          <span className="crisp-loader__spark" style={{ top: "70%", left: "64%", ["--d" as string]: "1.2s" }} />
        </div>

        {/* Simple loader (client feedback 1.0) — a single tracked-out NOSTRUM
            wordmark over the warm glow. Each letter sits in its own overflow-
            hidden mask so the rise/exit reads as a clean editorial reveal. */}
        <div className="nostrum-loader" aria-label="Nostrum">
          <div className="nostrum-loader__mark">
            {"NOSTRUM".split("").map((ch, i) => (
              <span key={i} className="nostrum-loader__mask" aria-hidden="true">
                <span className="nostrum-loader__letter">{ch}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="crisp-header__content">
        <div className="crisp-header__center">
          <div className="crisp-header__title-wrap">
            <h1 className="crisp-header__h1">{heroCopy[0].h1}</h1>
            <p className="crisp-header__p">{heroCopy[0].sub}</p>
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
                alt="A dark amber glass Nostrum bottle catching a single streak of warm gold light against black, the opening frame of the scroll-through reveal."
                className="crisp-loader__cover-img is--frame"
              />
            </div>
          </div>
          {/* Slide-1-only CTAs, anchored just under the thumbnail rail on the
              bottom-right. Shown by the loader reveal, hidden on any slide
              change (and on STA entry) alongside the hero copy. */}
          <div className="crisp-header__cta">
            <LuxButton
              label={t("hero.view_story")}
              onClick={() => scrollToStoryRef.current?.()}
            />
            <LuxButton
              label={t("hero.explore_products")}
              href={`/${locale}/products`}
            />
          </div>
        </div>

        {/* Scroll cue — a thin gold comet travelling a hairline rail, under a
            wide-tracked "Scroll" label. Slide-0 only: it fades in with the
            loader reveal (part of the smallElements group) and lifts/fades out
            on any slide change or STA entry, mirroring the CTA. */}
        <div className="crisp-header__scroll" aria-hidden="true">
          <span className="crisp-header__scroll-label">{t("hero.scroll")}</span>
          <span className="crisp-header__scroll-line">
            <span className="crisp-header__scroll-comet" />
          </span>
        </div>
      </div>
    </section>
  );
}
