"use client";

import { useEffect, useRef } from "react";
import "./crisp-header.css";

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

  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let split: any;

    (async () => {
      const gsapMod = await import("gsap");
      const { SplitText } = await import("gsap/SplitText");
      const { CustomEase } = await import("gsap/CustomEase");
      if (cancelled) return;

      const gsap = gsapMod.gsap ?? gsapMod.default;
      gsap.registerPlugin(SplitText, CustomEase);
      CustomEase.create("slideshow-wipe", "0.625, 0.05, 0, 1");

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
        // extra fades out to reveal the one beneath (2 → 3 → 4 → 5 → 1). The
        // stagger is tuned so the final fade lands ~as the fullscreen zoom
        // begins, leaving 1.png settled and ready to grow. (4 extras × 0.4s
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

        if (sliderNav.length) {
          tl.from(
            sliderNav,
            { yPercent: 150, stagger: 0.05, ease: "expo.out", duration: 1 },
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
        const animationDuration = 1.5;

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
          // If page is scrolled down, let native scroll handle it.
          if (window.scrollY > 5) return;
          // Ignore horizontal scrolls
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

          const direction = e.deltaY > 0 ? 1 : -1;

          // Release user to scroll down the page if on last slide
          if (current === length - 1 && direction === 1) return;
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
          if (window.scrollY > 5) return;
          const touchEndY = e.touches[0].clientY;
          const deltaY = touchStartY - touchEndY;
          const direction = deltaY > 0 ? 1 : -1;

          if (current === length - 1 && direction === 1) return;
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
      try {
        split?.revert?.();
      } catch { }
      ctx?.revert?.();
      // Reset to the initial loading state in case of dev remount.
      container.classList.add("is--loading", "is--hidden");
      document.body.classList.remove("is--intro-active");
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
              src="/images/1.png"
              alt="Extreme close-up of a ripe green olive, focusing on its dimpled skin texture and stem scar under warm golden light."
              data-slideshow="parallax"
              draggable="false"
            />
          </div>
          <div data-slideshow="slide" className="crisp-header__slider-slide">
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
              src="/images/3.png"
              alt="Close-up of the curved shoulder of a dark amber glass olive oil bottle, reflecting a thin streak of gold light on a black background."
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
              src="/images/5.png"
              alt="Close-up of a silvery-green olive leaf showing its fine veins and matte texture, separated from a black background by warm gold backlight."
              data-slideshow="parallax"
              draggable="false"
            />
          </div>
        </div>
      </div>

      <div className="crisp-loader">
        <div className="willem-loader">
          <div className="willem__h1">
            <div className="willem__h1-start">
              <span className="willem__letter">N</span>
              <span className="willem__letter">O</span>
              <span className="willem__letter">S</span>
            </div>
            <div className="willem-loader__box">
              <div className="willem-loader__box-inner">
                <div className="willem__growing-image">
                  <div className="willem__growing-image-wrap">
                    <img
                      className="willem__cover-image-extra is--1"
                      src="/images/2.png"
                      loading="eager"
                      alt="Close-up of glistening drop of olive oil on the rounded edge of a matte black pouring spout, lit with warm amber light."
                    />
                    <img
                      className="willem__cover-image-extra is--2"
                      src="/images/3.png"
                      loading="eager"
                      alt="Close-up of the curved shoulder of a dark amber glass olive oil bottle, reflecting a thin streak of gold light on a black background."
                    />
                    <img
                      className="willem__cover-image-extra is--3"
                      src="/images/4.png"
                      loading="eager"
                      alt="Close-up of the glossy surface of extra virgin olive oil, its golden-green ripples catching soft amber light."
                    />
                    <img
                      className="willem__cover-image-extra is--4"
                      src="/images/5.png"
                      loading="eager"
                      alt="Close-up of a silvery-green olive leaf showing its fine veins and matte texture, separated from a black background by warm gold backlight."
                    />
                    <img
                      className="willem__cover-image"
                      src="/images/1.png"
                      loading="eager"
                      alt="Extreme close-up of a ripe green olive, focusing on its dimpled skin texture and stem scar under warm golden light."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="willem__h1-end">
              <span className="willem__letter">T</span>
              <span className="willem__letter">R</span>
              <span className="willem__letter">U</span>
              <span className="willem__letter">M</span>
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
                src="/images/1.png"
                alt="Extreme close-up of a ripe green olive, focusing on its dimpled skin texture and stem scar under warm golden light."
                className="crisp-loader__cover-img"
              />
            </div>
            <div data-slideshow="thumb" className="crisp-header__slider-nav-btn">
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
                src="/images/3.png"
                alt="Close-up of the curved shoulder of a dark amber glass olive oil bottle, reflecting a thin streak of gold light on a black background."
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
                src="/images/5.png"
                alt="Close-up of a silvery-green olive leaf showing its fine veins and matte texture, separated from a black background by warm gold backlight."
                className="crisp-loader__cover-img"
              />
            </div>
          </div>
          <p className="crisp-header__p">Extra virgin olive oil</p>
        </div>
      </div>
    </section>
  );
}
