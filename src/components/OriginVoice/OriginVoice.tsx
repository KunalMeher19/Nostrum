"use client";

import { useEffect, useRef } from "react";
import "./origin-voice.css";

/* ------------------------------------------------------------------ */
/* OriginVoice                                                         */
/*                                                                     */
/* The family's voice — one line, italic display type on bark-brown,   */
/* revealed word by word as it scrolls into view. Sits between the     */
/* scroll-story and the numbers on /origins: after the pictures have   */
/* spoken, a single human sentence before the proof.                   */
/*                                                                     */
/* Motion: each word is a masked span; a single ScrollTrigger scrub    */
/* lifts them in sequence (stagger via per-word delay on one scrubbed  */
/* progress — same cheap single-tween pattern as StoryScenes).         */
/* Reduced motion: words simply visible, no scrub.                     */
/* ------------------------------------------------------------------ */

// Placeholder line in the brief's voice — the client may supply the real
// family quote (and attribution) when copy arrives.
const QUOTE =
  "My grandfather said the tree decides — we only listen.";
const ATTRIBUTION = "— the Nostrum family";

export default function OriginVoice() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      root.classList.add("is--static");
      return;
    }

    const words = Array.from(
      root.querySelectorAll<HTMLElement>(".origin-voice__word")
    );
    const attribution = root.querySelector<HTMLElement>(
      ".origin-voice__attribution"
    );
    if (!words.length) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const smooth = (v: number) => v * v * (3 - 2 * v);

    // One scrubbed progress drives every word: word i lives in a small
    // window of the 0→1, so they ripple up one after another as you scroll.
    const applyProgress = (p: number) => {
      const n = words.length;
      // Each word's window is WIN wide, starts spread across the first 80%
      // (the last 20% of travel holds the finished line + attribution).
      const WIN = 0.3;
      words.forEach((w, i) => {
        const start = (i / n) * (0.8 - WIN);
        const local = smooth(clamp01((p - start) / WIN));
        w.style.opacity = `${0.15 + local * 0.85}`;
        w.style.transform = `translateY(${(1 - local) * 0.55}em)`;
      });
      if (attribution) {
        const local = smooth(clamp01((p - 0.72) / 0.2));
        attribution.style.opacity = `${local}`;
        attribution.style.transform = `translateY(${(1 - local) * 14}px)`;
      }
    };

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;

      applyProgress(0);

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: root,
          start: "top 78%",
          end: "center 45%",
          scrub: true,
          invalidateOnRefresh: true,
          refreshPriority: -1,
          onUpdate: (self: { progress: number }) =>
            applyProgress(self.progress),
          onRefresh: (self: { progress: number }) =>
            applyProgress(self.progress),
        });
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  const words = QUOTE.split(" ");

  return (
    <section
      className="origin-voice"
      ref={rootRef}
      aria-label="A word from the family"
    >
      <blockquote className="origin-voice__quote">
        <p className="origin-voice__line">
          {words.map((w, i) => (
            // The joining space lives OUTSIDE the mask — a trailing space
            // inside an overflow:hidden inline-block gets trimmed and the
            // words fuse together.
            <span key={`${w}-${i}`}>
              <span className="origin-voice__mask">
                <span className="origin-voice__word">{w}</span>
              </span>{" "}
            </span>
          ))}
        </p>
        <footer className="origin-voice__attribution">{ATTRIBUTION}</footer>
      </blockquote>
    </section>
  );
}
