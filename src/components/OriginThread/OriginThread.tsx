"use client";

import { useEffect, useRef } from "react";
import "./origin-thread.css";

/* ------------------------------------------------------------------ */
/* OriginThread                                                        */
/*                                                                     */
/* The chapter thread — a hairline gold line pinned to the left edge   */
/* of /origins that grows with overall page scroll, with a tick per    */
/* chapter. Makes the long page read as an authored book: you always   */
/* know how deep into the story you are.                               */
/*                                                                     */
/* Pinned by NATIVE position:sticky (zero-height sticky shell at the   */
/* top of [data-main]) — NOT position:fixed, which breaks under the    */
/* transformed [data-main] ancestor (will-change/GSAP transforms make  */
/* "fixed" resolve against the page, so the thread would scroll away). */
/* Same approach as the StoryScenes stage. Sticky spans the whole      */
/* height of <main>, so the thread stays visible through every scene.  */
/*                                                                     */
/* Chapters are discovered from the DOM ([data-origin-chapter] on the  */
/* page's sections), so reordering beats never breaks the thread. Tick */
/* positions = each section's top as a fraction of total scrollable    */
/* height, recomputed on ScrollTrigger refresh (covers image loads,    */
/* resizes and the pinned story's extra travel).                       */
/*                                                                     */
/* Fill is driven by rAF-throttled scroll progress; passed ticks turn  */
/* gold. Hidden on small screens (CSS) and under reduced motion (the   */
/* decoration is pure motion feedback).                                */
/* ------------------------------------------------------------------ */

export default function OriginThread() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return; // stays hidden (CSS default is opacity 0)

    const fill = root.querySelector<HTMLElement>(".origin-thread__fill");
    const ticksWrap = root.querySelector<HTMLElement>(
      ".origin-thread__ticks"
    );
    if (!fill || !ticksWrap) return;

    let cancelled = false;
    let rafId = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scrollTriggerRef: any = null;
    let onRefresh: (() => void) | null = null;

    type Tick = { el: HTMLElement; at: number };
    let ticks: Tick[] = [];

    // (Re)build ticks from the chapters present in the DOM. Positions are
    // fractions of the total scrollable height, so they line up with the
    // fill which is plain scroll progress.
    const buildTicks = () => {
      const chapters = Array.from(
        document.querySelectorAll<HTMLElement>("[data-origin-chapter]")
      );
      const scrollable = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      ticksWrap.textContent = "";
      ticks = chapters.map((ch) => {
        const at = Math.min(
          (ch.getBoundingClientRect().top + window.scrollY) / scrollable,
          1
        );
        const el = document.createElement("span");
        el.className = "origin-thread__tick";
        el.style.top = `${at * 100}%`;
        const label = document.createElement("i");
        label.className = "origin-thread__tick-label";
        label.textContent = ch.dataset.originChapter ?? "";
        el.appendChild(label);
        ticksWrap.appendChild(el);
        return { el, at };
      });
    };

    const paint = () => {
      const scrollable = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const p = Math.min(window.scrollY / scrollable, 1);
      fill.style.transform = `scaleY(${p})`;
      ticks.forEach((t) => t.el.classList.toggle("is--passed", p >= t.at));
    };

    const requestPaint = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(paint);
    };

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;
      scrollTriggerRef = ScrollTrigger;

      // Rebuild on every global refresh — layout has just been remeasured
      // (image loads, resize, the pinned story's spacer), so tick fractions
      // are only correct if recomputed now.
      onRefresh = () => {
        buildTicks();
        paint();
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);

      buildTicks();
      paint();
      root.classList.add("is--on");
      window.addEventListener("scroll", requestPaint, { passive: true });
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", requestPaint);
      if (onRefresh)
        scrollTriggerRef?.removeEventListener?.("refresh", onRefresh);
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="origin-thread" aria-hidden="true">
      <div className="origin-thread__pin">
        <span className="origin-thread__track" />
        <span className="origin-thread__fill" />
        <span className="origin-thread__ticks" />
      </div>
    </div>
  );
}
