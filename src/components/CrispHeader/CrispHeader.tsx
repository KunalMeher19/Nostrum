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

      // ---- Loading Animation (verbatim logic, scoped to `container`) -------
      const initCrispLoadingAnimation = () => {
        const heading = container.querySelectorAll(".crisp-header__h1");
        const revealImages = container.querySelectorAll(
          ".crisp-loader__group > *"
        );
        const isScaleUp = container.querySelectorAll(".crisp-loader__media");
        const isScaleDown = container.querySelectorAll(
          ".crisp-loader__media .is--scale-down"
        );
        const isRadius = container.querySelectorAll(
          ".crisp-loader__media.is--scaling.is--radius"
        );
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

        if (revealImages.length) {
          tl.fromTo(
            revealImages,
            { xPercent: 500 },
            { xPercent: -500, duration: 2.5, stagger: 0.05 }
          );
        }

        if (isScaleDown.length) {
          tl.to(
            isScaleDown,
            {
              scale: 0.5,
              duration: 2,
              stagger: { each: 0.05, from: "edges", ease: "none" },
              onComplete: () => {
                if (isRadius) {
                  isRadius.forEach((el) => el.classList.remove("is--radius"));
                }
              },
            },
            "-=0.1"
          );
        }

        if (isScaleUp.length) {
          tl.fromTo(
            isScaleUp,
            { width: "10em", height: "10em" },
            { width: "100vw", height: "100dvh", duration: 2 },
            "< 0.5"
          );
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
      };

      ctx = gsap.context(() => {
        initSlideShow(container);

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
      }, container);
    })();

    return () => {
      cancelled = true;
      try {
        split?.revert?.();
      } catch {}
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
        <div className="crisp-loader__wrap">
          <div className="crisp-loader__groups">
            <div className="crisp-loader__group is--duplicate">
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/4.png"
                    alt="Close-up of the glossy surface of extra virgin olive oil, its golden-green ripples catching soft amber light."
                    className="crisp-loader__cover-img"
                  />
                </div>
              </div>
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/5.png"
                    alt="Close-up of a silvery-green olive leaf showing its fine veins and matte texture, separated from a black background by warm gold backlight."
                    className="crisp-loader__cover-img"
                  />
                </div>
              </div>
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/1.png"
                    alt="Extreme close-up of a ripe green olive, focusing on its dimpled skin texture and stem scar under warm golden light."
                    className="crisp-loader__cover-img"
                  />
                </div>
              </div>
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/2.png"
                    alt="Close-up of glistening drop of olive oil on the rounded edge of a matte black pouring spout, lit with warm amber light."
                    className="crisp-loader__cover-img"
                  />
                </div>
              </div>
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/3.png"
                    alt="Close-up of the curved shoulder of a dark amber glass olive oil bottle, reflecting a thin streak of gold light on a black background."
                    className="crisp-loader__cover-img"
                  />
                </div>
              </div>
            </div>
            <div className="crisp-loader__group is--relative">
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/4.png"
                    alt="Close-up of the glossy surface of extra virgin olive oil, its golden-green ripples catching soft amber light."
                    className="crisp-loader__cover-img is--scale-down"
                  />
                </div>
              </div>
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/5.png"
                    alt="Close-up of a silvery-green olive leaf showing its fine veins and matte texture, separated from a black background by warm gold backlight."
                    className="crisp-loader__cover-img is--scale-down"
                  />
                </div>
              </div>
              <div className="crisp-loader__single">
                <div className="crisp-loader__media is--scaling is--radius">
                  <img
                    loading="eager"
                    src="/images/1.png"
                    alt="Extreme close-up of a ripe green olive, focusing on its dimpled skin texture and stem scar under warm golden light."
                    className="crisp-loader__cover-img"
                  />
                </div>
              </div>
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/2.png"
                    alt="Close-up of glistening drop of olive oil on the rounded edge of a matte black pouring spout, lit with warm amber light."
                    className="crisp-loader__cover-img is--scale-down"
                  />
                </div>
              </div>
              <div className="crisp-loader__single">
                <div className="crisp-loader__media">
                  <img
                    loading="eager"
                    src="/images/3.png"
                    alt="Close-up of the curved shoulder of a dark amber glass olive oil bottle, reflecting a thin streak of gold light on a black background."
                    className="crisp-loader__cover-img is--scale-down"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="crisp-loader__fade"></div>
          <div className="crisp-loader__fade is--duplicate"></div>
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
