"use client";

import { useEffect } from "react";
import "lenis/dist/lenis.css";
import { setLenis } from "./lenisStore";

/**
 * SmoothScroll — initialises a Lenis instance with autoRaf: true so it
 * ticks itself via requestAnimationFrame without any external loop.
 *
 * Mount this once near the root of the app (e.g. inside <body> in layout.tsx).
 * It renders nothing — it's a pure side-effect component.
 */
export default function SmoothScroll() {
  useEffect(() => {
    let lenis: import("lenis").default | null = null;

    (async () => {
      const { default: Lenis } = await import("lenis");
      lenis = new Lenis({ autoRaf: true });
      // Publish the instance so ScrollTrigger-driven components (CrispHeader's
      // scroll-through) can sync to Lenis' interpolated scroll.
      setLenis(lenis);
    })();

    return () => {
      setLenis(null);
      lenis?.destroy();
    };
  }, []);

  return null;
}
