"use client";

import { useEffect, useRef } from "react";
import "./crisp-header.css";
import { onLenis } from "../SmoothScroll/lenisStore";

/* ---- Scroll-through animation (STA) config ------------------------------- */
// Frames live in /public/frames as ezgif-frame-001.jpg … ezgif-frame-240.jpg.
const STA_FRAME_COUNT = 240;
// Frame 001 is the 5th slide's still; the scrub starts one frame later so the
// hand-off from slide → canvas is seamless.
const STA_START_FRAME = 2;
// Scroll length of the pinned scrub, in viewport heights. ~238 frames over 5vh
// (~20px/frame at 900px tall) keeps the sequence dense enough to feel filmic.
const STA_SCROLL_VH = 5;
const staFramePath = (i: number) =>
  `/frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

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

      const enterSta = () => {
        if (phase === "sta") return;
        phase = "sta";
        staArmed = false;
        lenisRef?.start();
        // Slide the fixed top bar (Nostrum wordmark + menu toggle) up and out
        // as the STA entry animation. CSS on .underlay-nav__header handles the
        // motion; it stays up for the whole scrub and mirrors back down when we
        // return to the slideshow (enterSlides).
        document.body.classList.add("is--sta-active");
      };
      const enterSlides = () => {
        if (phase === "slides") return;
        phase = "slides";
        lenisRef?.scrollTo(0, { immediate: true });
        lenisRef?.stop();
        document.body.classList.remove("is--sta-active");
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
          ".crisp-header__top, .crisp-header__p"
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
            { width: "100vw", height: "100dvh", duration: 2 },
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

        tl.call(
          function () {
            container.classList.remove("is--loading");
            // Hero is live — arm the scroll-through (waits on frame preload too).
            loaderDone = true;
            maybeInitScrollThrough();
          },
          undefined,
          "+=0.45"
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
        // Vertical slide transition, a touch quicker than the old 1.5s horizontal.
        const animationDuration = 1.2;

        ui.slides.forEach((slide, index) =>
          slide.setAttribute("data-index", String(index))
        );
        ui.thumbs.forEach((thumb, index) =>
          thumb.setAttribute("data-index", String(index))
        );

        ui.slides[current]?.classList.add("is--current");
        ui.thumbs[current]?.classList.add("is--current");

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
              },
              onComplete() {
                currentSlide.classList.remove("is--current");
                animating = false;
              },
            })
            // Vertical wipe: NEXT (direction 1, scroll down) sends the current
            // slide up and out the top while the upcoming slide rises in from
            // the bottom. PREV reverses it. Parallax lag on the inner image is
            // preserved via the opposing 75% offset.
            .to(currentSlide, { yPercent: -direction * 100 }, 0)
            .to(currentInner, { yPercent: direction * 75 }, 0)
            .fromTo(
              upcomingSlide,
              { yPercent: direction * 100 },
              { yPercent: 0 },
              0
            )
            .fromTo(
              upcomingInner,
              { yPercent: -direction * 75 },
              { yPercent: 0 },
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
        const handleTouchStart = (e: TouchEvent) => {
          touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
          if (phase === "sta") return;
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
            if (!animating) enterSta();
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
      let loaderDone = false;
      let staStarted = false;

      const maybeInitScrollThrough = () => {
        if (staStarted || !framesReady || !loaderDone || prefersReducedMotion) {
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

        const sizeCanvas = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.round(window.innerWidth * dpr);
          canvas.height = Math.round(window.innerHeight * dpr);
        };

        // Cover-fit draw (object-fit: cover) centred on the canvas.
        const drawFrame = (index: number) => {
          const img = frameImages[index];
          if (!img || !img.complete || !img.naturalWidth) return;
          const cw = canvas.width;
          const ch = canvas.height;
          const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          cctx.clearRect(0, 0, cw, ch);
          cctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        };

        const frameState = { i: STA_START_FRAME };
        let lastDrawn = -1;
        const renderFrame = () => {
          const index = Math.round(frameState.i);
          if (index === lastDrawn) return;
          lastDrawn = index;
          drawFrame(index);
        };

        sizeCanvas();
        drawFrame(STA_START_FRAME); // prime the bitmap (still hidden at progress 0)

        // Exit targets — the reverse of the post-load entrance.
        const pEl = host.querySelector(".crisp-header__p");
        const navChildren = host.querySelectorAll(
          ".crisp-header__slider-nav > *"
        );
        const words =
          split && split.words && split.words.length ? split.words : null;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: host,
            start: "top top",
            end: () => "+=" + window.innerHeight * STA_SCROLL_VH,
            pin: true,
            pinSpacing: true,
            // Numeric scrub (vs. `true`) makes ScrollTrigger LERP the timeline
            // toward the scroll position on its own gsap ticker rather than
            // snapping 1:1. Two things fall out of this: the frame sequence is
            // smoothed while you scroll, and — because the ticker keeps easing
            // even after scroll input stops — the frames glide on for a beat and
            // ease to a soft stop instead of freezing. 1.2s = the "Balanced"
            // follow-through the client picked.
            scrub: 1.2,
            invalidateOnRefresh: true,
            // UnderlayNav applies a transform to [data-main] (the pinned hero's
            // ancestor) to slide the page when the menu opens. A transformed
            // ancestor breaks position:fixed pinning, so pin via transform
            // instead — this also lets the hero ride the menu's page-slide.
            pinType: "transform",
            anticipatePin: 1,
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
        if (words) {
          tl.to(
            words,
            { yPercent: 110, stagger: 0.03, ease: "power2.in", duration: 0.22 },
            0
          );
        }
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

        // The frame scrub spans the entire pinned length.
        tl.to(
          frameState,
          { i: STA_FRAME_COUNT, duration: 1, onUpdate: renderFrame },
          0
        );

        const handleResize = () => {
          sizeCanvas();
          lastDrawn = -1;
          renderFrame();
        };
        window.addEventListener("resize", handleResize);

        // Frames loaded after layout settled — recalc pin distances.
        ScrollTrigger.refresh();

        staCleanup = () => {
          window.removeEventListener("resize", handleResize);
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      }

      preloadFrames();

      ctx = gsap.context(() => {
        const cleanupSlideshow = initSlideShow(container);

        // Wait for the display font (Fraunces) to be active before splitting
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
            await document.fonts.load("400 1em Fraunces");
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
              className="crisp-header__slider-slide-inner"
              src="/images/3.png"
              alt="Close-up of the curved shoulder of a dark amber glass olive oil bottle, reflecting a thin streak of gold light on a black background."
              data-slideshow="parallax"
              draggable="false"
            />
          </div>
          <div data-slideshow="slide" className="crisp-header__slider-slide">
            <img
              className="crisp-header__slider-slide-inner"
              src="/images/5.png"
              alt="Close-up of a silvery-green olive leaf showing its fine veins and matte texture, separated from a black background by warm gold backlight."
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
          <h1 className="crisp-header__h1">Not simply olive oil</h1>
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
                src="/images/3.png"
                alt="Close-up of the curved shoulder of a dark amber glass olive oil bottle, reflecting a thin streak of gold light on a black background."
                className="crisp-loader__cover-img"
              />
            </div>
            <div data-slideshow="thumb" className="crisp-header__slider-nav-btn">
              <img
                loading="eager"
                src="/images/5.png"
                alt="Close-up of a silvery-green olive leaf showing its fine veins and matte texture, separated from a black background by warm gold backlight."
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
          <p className="crisp-header__p">Extra virgin olive oil</p>
        </div>
      </div>
    </section>
  );
}
