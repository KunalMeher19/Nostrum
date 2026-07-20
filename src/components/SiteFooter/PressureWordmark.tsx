"use client";

// Adapted from react-bits TextPressure (https://codepen.io/JuanFuentes/full/rgXKGQ)
// for the Nostrum footer wordmark — heavily tamed for the brand:
//   · brand display face (var(--font-display)), not a 3rd family
//   · weight-only pressure (wght 420→720) — the width axis read broken
//     when frozen mid-interaction; weight alone stays a coherent word
//   · rests as a ghost off-white poster (Balmain-style); lime is applied
//     ONLY under the cursor via a per-letter --p proximity var, so the
//     accent stays "jewelry" instead of a flat lime wall (no glow)
//   · one-time staggered rise entrance when the footer scrolls in
//   · slower cursor lerp for a heavier, more luxurious response
//   · rAF loop only runs while the footer is actually on screen
//   · prefers-reduced-motion renders the static wordmark, no listeners

import { useEffect, useRef, useState, useCallback } from "react";

const REST_WGHT = 420;
const PEAK_WGHT = 720;

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// 0 at maxDist+, 1 at the cursor — linear falloff.
const proximity = (distance: number, maxDist: number) =>
  Math.max(0, 1 - distance / maxDist);

export default function PressureWordmark({ text = "NOSTRUM" }: { text?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });

  const [fontSize, setFontSize] = useState(120);
  const [entered, setEntered] = useState(false);

  const chars = text.split("");

  const setSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width } = container.getBoundingClientRect();
    // Poster scale: the word fills the container width (flex spreads letters).
    setFontSize(Math.max(48, width / (chars.length / 1.35)));
  }, [chars.length]);

  useEffect(() => {
    setSize();
    window.addEventListener("resize", setSize);
    return () => window.removeEventListener("resize", setSize);
  }, [setSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Reduced motion: skip the entrance and the pressure loop entirely —
    // the wordmark renders static at its rest state.
    if (prefersReduced) {
      setEntered(true);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      cursorRef.current.x = t.clientX;
      cursorRef.current.y = t.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    // Start the eased cursor far above the wordmark so first paint is calm
    // (every letter at rest, zero lime).
    const r = container.getBoundingClientRect();
    mouseRef.current.x = r.left + r.width / 2;
    mouseRef.current.y = r.top - r.width;
    cursorRef.current = { ...mouseRef.current };

    let rafId = 0;
    let running = false;

    const animate = () => {
      // Heavy, slow lerp — the type leans toward the cursor rather than
      // snapping to it. Premium = weight, not twitch.
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 22;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 22;

      const title = titleRef.current;
      if (title) {
        // Tight falloff — only the letters nearest the cursor respond, so
        // the lime reads as a spot of light, not a wash.
        const maxDist = title.getBoundingClientRect().width / 3;

        for (const span of spansRef.current) {
          if (!span) continue;
          const sr = span.getBoundingClientRect();
          const d = dist(mouseRef.current, {
            x: sr.x + sr.width / 2,
            y: sr.y + sr.height / 2,
          });

          const p = proximity(d, maxDist);
          const wght = Math.round(REST_WGHT + (PEAK_WGHT - REST_WGHT) * p);
          const settings = `'wght' ${wght}`;
          if (span.style.fontVariationSettings !== settings) {
            span.style.fontVariationSettings = settings;
          }
          // Drives the off-white→lime tint in CSS (color-mix on --p).
          span.style.setProperty("--p", p.toFixed(3));
        }
      }
      if (running) rafId = requestAnimationFrame(animate);
    };

    // Only burn frames while the footer is on screen; first intersection
    // also fires the one-time rise entrance.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          if (!running) {
            running = true;
            rafId = requestAnimationFrame(animate);
          }
        } else if (running) {
          running = false;
          cancelAnimationFrame(rafId);
        }
      },
      { threshold: 0.25 }
    );
    io.observe(container);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      io.disconnect();
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`nf-pressure${entered ? " is--in" : ""}`}
      aria-hidden="true"
    >
      <h2 ref={titleRef} className="nf-pressure__title" style={{ fontSize }}>
        {chars.map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              spansRef.current[i] = el;
            }}
            className="nf-pressure__char"
            style={{ "--i": i } as React.CSSProperties}
          >
            {char}
          </span>
        ))}
      </h2>
    </div>
  );
}
