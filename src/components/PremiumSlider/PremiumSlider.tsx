"use client";

import { useEffect, useRef } from "react";
import "./premium-slider.css";

type SliderItem = {
  id: string;
  image: string;
  name: string;
  detail: string;
  price: string;
  onAdd: () => void;
  href: string;
};

type PremiumSliderProps = {
  items: SliderItem[];
};

export default function PremiumSlider({ items }: PremiumSliderProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || items.length === 0) return;

    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const { Draggable } = await import("gsap/Draggable");
      const { InertiaPlugin } = await import("gsap/InertiaPlugin");
      if (cancelled) return;

      const gsap = gsapMod.gsap ?? gsapMod.default;
      gsap.registerPlugin(Draggable, InertiaPlugin);

      let timelineInstance: any = null;

      const slides = gsap.utils.toArray<HTMLElement>('[data-slider="slide"]');
      const nextButton = wrapper.querySelector<HTMLButtonElement>('[data-slider-button="next"]');
      const prevButton = wrapper.querySelector<HTMLButtonElement>('[data-slider-button="prev"]');
      const totalElement = wrapper.querySelector<HTMLElement>('[data-slide-count="total"]');
      const stepsParent = wrapper.querySelector<HTMLElement>('[data-slide-count="step"]')?.parentElement;
      const stepElement = wrapper.querySelector<HTMLElement>('[data-slide-count="step"]');

      if (slides.length === 0) return;

      let activeElement: HTMLElement;
      const totalSlides = slides.length;

      // Set total count
      if (totalElement) totalElement.textContent = totalSlides < 10 ? `0${totalSlides}` : String(totalSlides);

      // Clone step indicators
      if (stepsParent && stepElement) {
        stepsParent.innerHTML = '';
        slides.forEach((_, index) => {
          const stepClone = stepElement.cloneNode(true) as HTMLElement;
          stepClone.textContent = index + 1 < 10 ? `0${index + 1}` : String(index + 1);
          stepsParent.appendChild(stepClone);
        });
      }
      const allSteps = stepsParent ? Array.from(stepsParent.querySelectorAll<HTMLElement>('[data-slide-count="step"]')) : [];

      // Responsive: on desktop, active is next slide; on mobile, active is current
      const mq = window.matchMedia('(min-width: 992px)');
      let useNextForActive = mq.matches;
      mq.addEventListener('change', (e) => {
        useNextForActive = e.matches;
        if (currentEl) {
          applyActive(currentEl, currentIndex, false);
        }
      });

      let currentEl: HTMLElement | null = null;
      let currentIndex = 0;

      function resolveActive(el: HTMLElement) {
        const idx = slides.indexOf(el);
        const nextIdx = (idx + 1) % slides.length;
        return useNextForActive ? slides[nextIdx] : el;
      }

      function applyActive(el: HTMLElement, index: number, animateNumbers = true) {
        if (activeElement) activeElement.classList.remove('active');
        const target = resolveActive(el);
        target.classList.add('active');
        activeElement = target;

        // Update step counter
        if (allSteps.length) {
          if (animateNumbers) {
            gsap.to(allSteps, { y: `${-100 * index}%`, ease: "power3", duration: 0.45 });
          } else {
            gsap.set(allSteps, { y: `${-100 * index}%` });
          }
        }
      }

      // Horizontal loop helper - MUST be defined before being called
      function horizontalLoop(itemsToLoop: HTMLElement[], config: any): any {
        const loopItems = gsap.utils.toArray(itemsToLoop);
        const cfg = config || {};

        const onChange = cfg.onChange;
        let lastIndex = 0;

        const tl = gsap.timeline({
          repeat: cfg.repeat,
          onUpdate: onChange && function () {
            const i = (tl as any).closestIndex();
            if (lastIndex !== i) {
              lastIndex = i;
              onChange(loopItems[i], i);
            }
          },
          paused: cfg.paused,
          defaults: { ease: "none" },
          onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)
        });

        const length = loopItems.length;
        const startX = (loopItems[0] as HTMLElement).offsetLeft;
        const times: number[] = [];
        const widths: number[] = [];
        const spaceBefore: number[] = [];
        const xPercents: number[] = [];
        let curIndex = 0;
        let indexIsDirty = false;

        const center = cfg.center;
        const pixelsPerSecond = (cfg.speed || 1) * 100;
        const snap = cfg.snap === false ? (v: number) => v : gsap.utils.snap(cfg.snap || 1);
        let timeOffset = 0;
        const container = center === true ? (loopItems[0] as HTMLElement).parentNode : gsap.utils.toArray(center)[0] || (loopItems[0] as HTMLElement).parentNode;
        let totalWidth: number;

        const getTotalWidth = () => {
          const lastItem = loopItems[length - 1] as HTMLElement;
          return lastItem.offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + spaceBefore[0] + lastItem.offsetWidth * ((gsap.getProperty(lastItem, "scaleX") as number) || 1) + (parseFloat(cfg.paddingRight) || 0);
        };

        const populateWidths = () => {
          let b1 = (container as HTMLElement).getBoundingClientRect();
          let b2;
          loopItems.forEach((el, i) => {
            const elem = el as HTMLElement;
            widths[i] = parseFloat(gsap.getProperty(elem, "width", "px") as string);
            xPercents[i] = snap(parseFloat(gsap.getProperty(elem, "x", "px") as string) / widths[i] * 100 + parseFloat(gsap.getProperty(elem, "xPercent") as string));
            b2 = elem.getBoundingClientRect();
            spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
            b1 = b2;
          });
          gsap.set(loopItems, {
            xPercent: (i: number) => xPercents[i]
          });
          totalWidth = getTotalWidth();
        };

        let timeWrap: any;

        const populateOffsets = () => {
          timeOffset = center ? tl.duration() * ((container as HTMLElement).offsetWidth / 2) / totalWidth : 0;
          if (center) {
            times.forEach((t, i) => {
              times[i] = timeWrap(tl.labels["label" + i] + tl.duration() * widths[i] / 2 / totalWidth - timeOffset);
            });
          }
        };

        const getClosest = (values: number[], value: number, wrap: number) => {
          let i = values.length;
          let closest = 1e10;
          let index = 0;
          let d;
          while (i--) {
            d = Math.abs(values[i] - value);
            if (d > wrap / 2) {
              d = wrap - d;
            }
            if (d < closest) {
              closest = d;
              index = i;
            }
          }
          return index;
        };

        const populateTimeline = () => {
          tl.clear();
          for (let i = 0; i < length; i++) {
            const item = loopItems[i] as HTMLElement;
            const curX = xPercents[i] / 100 * widths[i];
            const distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
            const distanceToLoop = distanceToStart + widths[i] * ((gsap.getProperty(item, "scaleX") as number) || 1);

            tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
              .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
              .add("label" + i, distanceToStart / pixelsPerSecond);
            times[i] = distanceToStart / pixelsPerSecond;
          }
          timeWrap = gsap.utils.wrap(0, tl.duration());
        };

        const refresh = (deep?: boolean) => {
          const progress = tl.progress();
          tl.progress(0, true);
          populateWidths();
          if (deep) populateTimeline();
          populateOffsets();
          if (deep && (tl as any).draggable) {
            tl.time(times[curIndex], true);
          } else {
            tl.progress(progress, true);
          }
        };

        const onResize = () => refresh(true);

        gsap.set(loopItems, { x: 0 });
        populateWidths();
        populateTimeline();
        populateOffsets();
        window.addEventListener("resize", onResize);

        function toIndex(index: number, vars?: any) {
          vars = vars || {};
          if (Math.abs(index - curIndex) > length / 2) {
            index += index > curIndex ? -length : length;
          }
          const newIndex = gsap.utils.wrap(0, length, index);
          let time = times[newIndex];
          if ((time > tl.time()) !== (index > curIndex) && index !== curIndex) {
            time += tl.duration() * (index > curIndex ? 1 : -1);
          }
          if (time < 0 || time > tl.duration()) {
            vars.modifiers = { time: timeWrap };
          }
          curIndex = newIndex;
          vars.overwrite = true;
          gsap.killTweensOf(proxy);
          return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
        }

        (tl as any).toIndex = (index: number, vars?: any) => toIndex(index, vars);
        (tl as any).closestIndex = (setCurrent?: boolean) => {
          const index = getClosest(times, tl.time(), tl.duration());
          if (setCurrent) {
            curIndex = index;
            indexIsDirty = false;
          }
          return index;
        };
        (tl as any).current = () => indexIsDirty ? (tl as any).closestIndex(true) : curIndex;
        (tl as any).next = (vars?: any) => toIndex((tl as any).current() + 1, vars);
        (tl as any).previous = (vars?: any) => toIndex((tl as any).current() - 1, vars);
        (tl as any).times = times;

        tl.progress(1, true).progress(0, true);

        if (cfg.reversed) {
          if (tl.vars.onReverseComplete) {
            tl.vars.onReverseComplete();
          }
          tl.reverse();
        }

        let proxy: HTMLDivElement;

        if (cfg.draggable && typeof Draggable === "function") {
          proxy = document.createElement("div");
          const wrap = gsap.utils.wrap(0, 1);
          let ratio: number;
          let startProgress: number;
          let draggable: any;
          let lastSnap: number;
          let initChangeX: number;
          let wasPlaying: boolean;

          const align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio));
          const syncIndex = () => (tl as any).closestIndex(true);

          draggable = Draggable.create(proxy, {
            trigger: (loopItems[0] as HTMLElement).parentNode as HTMLElement,
            type: "x",
            onPressInit() {
              const x = this.x;
              gsap.killTweensOf(tl);
              wasPlaying = !tl.paused();
              tl.pause();
              startProgress = tl.progress();
              refresh();
              ratio = 1 / totalWidth;
              initChangeX = (startProgress / -ratio) - x;
              gsap.set(proxy, { x: startProgress / -ratio });
            },
            onDrag: align,
            onThrowUpdate: align,
            overshootTolerance: 0,
            inertia: true,
            snap(value: number) {
              if (Math.abs(startProgress / -ratio - this.x) < 10) {
                return lastSnap + initChangeX;
              }
              const time = -(value * ratio) * tl.duration();
              const wrappedTime = timeWrap(time);
              const snapTime = times[getClosest(times, wrappedTime, tl.duration())];
              let dif = snapTime - wrappedTime;
              if (Math.abs(dif) > tl.duration() / 2) {
                dif += dif < 0 ? tl.duration() : -tl.duration();
              }
              lastSnap = (time + dif) / tl.duration() / -ratio;
              return lastSnap;
            },
            onRelease() {
              syncIndex();
              if (draggable.isThrowing) {
                indexIsDirty = true;
              }
            },
            onThrowComplete: () => {
              syncIndex();
              if (wasPlaying) tl.play();
            }
          })[0];
          (tl as any).draggable = draggable;
        }

        (tl as any).closestIndex(true);
        lastIndex = curIndex;
        if (onChange) onChange(loopItems[curIndex], curIndex);

        return tl;
      }

      // NOW we can create the loop
      const loop = horizontalLoop(slides, {
        paused: true,
        draggable: true,
        center: false,
        onChange: (element: HTMLElement, index: number) => {
          currentEl = element;
          currentIndex = index;
          activeIndexRef.current = index;
          applyActive(element, index, true);
        }
      });

      timelineInstance = loop;

      // Click to navigate
      function mapClickIndex(i: number) {
        return useNextForActive ? (i - 1 + slides.length) % slides.length : i;
      }

      slides.forEach((slide, i) => {
        slide.addEventListener("click", () => {
          if (slide.classList.contains("active")) return;
          loop.toIndex(mapClickIndex(i), { ease: "power3", duration: 0.725 });
        });
      });

      nextButton?.addEventListener("click", () => loop.next({ ease: "power3", duration: 0.725 }));
      prevButton?.addEventListener("click", () => loop.previous({ ease: "power3", duration: 0.725 }));

      if (!currentEl && slides[0]) {
        currentEl = slides[0];
        currentIndex = 0;
        applyActive(currentEl, currentIndex, false);
      }

      return () => {
        timelineInstance?.kill?.();
      };
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <div ref={wrapperRef} className="slider__section">
      <div className="slider__overlay">
        <div className="slider__overlay-inner">
          <div className="slider__overlay-count">
            <div className="slider__count-col">
              <h2 data-slide-count="step" className="slider__count-heading">01</h2>
            </div>
            <div className="slider__count-divider"></div>
            <div className="slider__count-col">
              <h2 data-slide-count="total" className="slider__count-heading">04</h2>
            </div>
          </div>
          <div className="slider__overlay-nav">
            <button aria-label="previous slide" data-slider-button="prev" className="slider__btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 17 12" fill="none" className="slider__btn-arrow">
                <path d="M6.28871 12L7.53907 10.9111L3.48697 6.77778H16.5V5.22222H3.48697L7.53907 1.08889L6.28871 0L0.5 6L6.28871 12Z" fill="currentColor"></path>
              </svg>
              <div className="slider__btn-overlay">
                <div className="slider__btn-overlay-corner"></div>
                <div className="slider__btn-overlay-corner top-right"></div>
                <div className="slider__btn-overlay-corner bottom-left"></div>
                <div className="slider__btn-overlay-corner bottom-right"></div>
              </div>
            </button>
            <button aria-label="next slide" data-slider-button="next" className="slider__btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 17 12" fill="none" className="slider__btn-arrow next">
                <path d="M6.28871 12L7.53907 10.9111L3.48697 6.77778H16.5V5.22222H3.48697L7.53907 1.08889L6.28871 0L0.5 6L6.28871 12Z" fill="currentColor"></path>
              </svg>
              <div className="slider__btn-overlay">
                <div className="slider__btn-overlay-corner"></div>
                <div className="slider__btn-overlay-corner top-right"></div>
                <div className="slider__btn-overlay-corner bottom-left"></div>
                <div className="slider__btn-overlay-corner bottom-right"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
      <div className="slider__main">
        <div className="slider__wrap">
          <div data-slider="list" className="slider__list">
            {items.map((item) => (
              <div key={item.id} data-slider="slide" className="slider__slide">
                <div className="slider__slide-inner">
                  {item.image && (
                    <img src={item.image} className="slide__img" alt={item.name} />
                  )}
                  <div className="slide__caption">
                    <div className="slide__caption-dot"></div>
                    <p className="slide__caption-label">{item.name}</p>
                  </div>
                  <a href={item.href} className="slide__link" aria-label={`View ${item.name}`} />
                  <button
                    type="button"
                    className="slide__add-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.onAdd();
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
