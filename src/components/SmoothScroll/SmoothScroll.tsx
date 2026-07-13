"use client";

import { useEffect } from "react";
import "lenis/dist/lenis.css";
import { setLenis } from "./lenisStore";

/**
 * SmoothScroll — initialises a single Lenis instance and phase-locks it to
 * GSAP's ticker.
 *
 * Lenis is driven from `gsap.ticker` (NOT its own autoRaf) so that the
 * smooth-scroll interpolation, every ScrollTrigger scrub, and the STA frame
 * canvas all advance on the SAME requestAnimationFrame. With autoRaf, Lenis ran
 * on a separate rAF: while you actively scroll, Lenis floods `scroll` events
 * that keep everything refreshed and the two clocks look fine — but the instant
 * you release, those events stop and the momentum tail is left driven by two
 * out-of-phase loops, so the frames render unevenly (smooth while dragging,
 * juddery the moment you let go). One shared ticker makes the release glide with
 * the exact same smoothness as the drag.
 *
 * Mount this once near the root of the app (e.g. inside <body> in layout.tsx).
 * It renders nothing — it's a pure side-effect component.
 */
export default function SmoothScroll() {
  useEffect(() => {
    let lenis: import("lenis").default | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let gsap: any = null;
    let tick: ((time: number) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let onScroll: (() => void) | null = null;

    (async () => {
      const [{ default: Lenis }, gsapMod, stMod] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap = gsapMod.gsap ?? gsapMod.default;
      const { ScrollTrigger } = stMod;
      gsap.registerPlugin(ScrollTrigger);

      // autoRaf:false — we tick Lenis ourselves off gsap.ticker (see below).
      lenis = new Lenis({ autoRaf: false });

      // Keep ScrollTrigger's scroll snapshot in lockstep with Lenis on every
      // scroll change (needed the frame a scrub-driven trigger reads position).
      onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      // Drive Lenis on gsap's ticker. gsap passes elapsed time in SECONDS;
      // Lenis.raf expects milliseconds.
      tick = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tick);
      // Disable gsap's lag smoothing so a stutter never desyncs Lenis from the
      // scrub — the tail must stay perfectly phase-locked.
      gsap.ticker.lagSmoothing(0);

      // Publish the instance so ScrollTrigger-driven components (CrispHeader's
      // scroll-through) can sync to Lenis' interpolated scroll.
      setLenis(lenis);
    })();

    return () => {
      setLenis(null);
      if (tick && gsap) gsap.ticker.remove(tick);
      if (lenis && onScroll) lenis.off("scroll", onScroll);
      lenis?.destroy();
    };
  }, []);

  return null;
}
