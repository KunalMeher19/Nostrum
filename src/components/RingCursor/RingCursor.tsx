"use client";

import { useEffect, useRef } from "react";
import "./ring-cursor.css";

/**
 * RingCursor — a white ring that follows the pointer, site-wide.
 *
 * Modelled on the Rolls-Royce Motor Cars cursor the client called out:
 *   - a 2.875rem (46px) ring, 2px white border, no fill
 *   - mix-blend-mode: difference on the wrapper, so it stays legible on both
 *     the dark hero and the light Shop without any per-section colour logic
 *   - it tracks the pointer with only a hair of lag — RR's "doesn't have a
 *     delay". We lerp at a high factor (0.35) on rAF, which reads as instant but
 *     still smooths raw pointer jitter.
 *   - it grows + fills faintly when over an interactive target (a, button,
 *     [role=button], .underlay-nav__link-large, etc.), the RR "hover" state.
 *
 * Gating: only mounts its behaviour on real pointer devices (pointer:fine +
 * hover:hover). On touch / coarse pointers it renders nothing and leaves the
 * native cursor alone. Honours prefers-reduced-motion by snapping (no lerp).
 *
 * The element is created and driven imperatively (not via React state) so the
 * per-frame position writes never trigger re-renders.
 */
export default function RingCursor() {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Bail on touch / coarse-pointer devices — no floating ring there.
    const fine =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    if (!fine) return;

    const ring = ringRef.current;
    if (!ring) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Enabling this class hides the native cursor site-wide (see CSS). Only do
    // it once we KNOW we're on a fine pointer, so touch users keep theirs.
    document.documentElement.classList.add("has-ring-cursor");

    // Target position (raw pointer) vs. rendered position (lerped toward it).
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let visible = false;
    let raf = 0;

    const render = () => {
      // Lerp factor 0.35 ≈ "instant but de-jittered". reduce → snap exactly.
      const k = reduce ? 1 : 0.35;
      rx += (tx - rx) * k;
      ry += (ty - ry) * k;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        ring.classList.add("is--visible");
        // Snap on first appearance so it doesn't fly in from screen centre.
        rx = tx;
        ry = ty;
      }
    };

    // Grow/fill over interactive targets — the RR hover cue.
    const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label, [data-cursor-grow]";
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest(INTERACTIVE)) ring.classList.add("is--grow");
    };
    const onOut = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest(INTERACTIVE)) {
        // Only drop grow if we're not moving onto another interactive target.
        const to = e.relatedTarget as Element | null;
        if (!to || !to.closest(INTERACTIVE)) ring.classList.remove("is--grow");
      }
    };

    // Hide while the pointer is off the document (or the window blurs), and on
    // mouse-down give a quick press cue.
    const onLeaveWin = () => {
      visible = false;
      ring.classList.remove("is--visible");
    };
    const onDown = () => ring.classList.add("is--down");
    const onUp = () => ring.classList.remove("is--down");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeaveWin);
    window.addEventListener("blur", onLeaveWin);

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeaveWin);
      window.removeEventListener("blur", onLeaveWin);
      document.documentElement.classList.remove("has-ring-cursor");
    };
  }, []);

  // Rendered for all clients; the effect decides whether to animate it and
  // whether to hide the native cursor. On touch it simply sits invisible.
  return (
    <div ref={ringRef} className="ring-cursor" aria-hidden="true">
      <span className="ring-cursor__ring" />
    </div>
  );
}
