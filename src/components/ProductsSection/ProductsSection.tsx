"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "./products-section.css";
import { onLenis } from "../SmoothScroll/lenisStore";

/* ------------------------------------------------------------------ */
/* ProductsSection — the Shop, with a basicagency-style scroll invert.  */
/*                                                                     */
/* The section starts DARK — ink-black, seamless with "Our Story" above  */
/* (content visible: light-on-dark title + dark product tiles). As you   */
/* scroll through it, ONE global scrubbed variable --page-t eases 0 → 1.  */
/* BOTH this section's colours AND the Story tail's --sp-* tokens derive  */
/* from it via color-mix(), so the previous + next section invert         */
/* together — the whole viewport stays uniform (no two-tone seam). The    */
/* nav rides on top with mix-blend-mode:difference, so it auto-contrasts  */
/* against whatever tone is behind it. Crossover at the section midpoint  */
/* ("past half it changes"), ~1 viewport of scroll, settles light (last   */
/* section). Reduced-motion keeps the scrub, drops the grain. Cards link  */
/* to /product/[id] (detail built later).                                 */
/* ------------------------------------------------------------------ */

type Product = {
  id: string;
  name: string;
  detail: string;
  price: string;
};

// x1 / x2 / x3 of the 5L bottle (§7 — mainly 5L, sold as packs; ~€35/5L,
// price not final). Placeholder tiles for now; real product photography
// drops straight into .shop-card__media later.
const PRODUCTS: Product[] = [
  { id: "single", name: "Single", detail: "5L · Extra Virgin", price: "€35" },
  { id: "duo", name: "Duo", detail: "2 × 5L", price: "€66" },
  { id: "trio", name: "Trio", detail: "3 × 5L", price: "€95" },
];

export default function ProductsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const grain = grainRef.current;
    if (!section) return;

    const root = document.documentElement;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    let unsubLenis = () => {};
    let detachScroll = () => {};
    let detachCta = () => {};

    // Nav colour as a function of the inversion t. The background is uniform at
    // every t, so the nav just needs to stay legible on it: white on the dark
    // phase → brand gold at the mid-grey crossover → ink on the light Shop. The
    // gold hop is what keeps it readable through the middle (a plain white→ink
    // fade would pass through grey and vanish on the grey background).
    const WHITE: [number, number, number] = [245, 245, 243];
    const GOLD: [number, number, number] = [230, 180, 34];
    const INK: [number, number, number] = [20, 22, 15];
    const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * k);
    const mix = (
      a: [number, number, number],
      b: [number, number, number],
      k: number
    ) => `rgb(${lerp(a[0], b[0], k)}, ${lerp(a[1], b[1], k)}, ${lerp(a[2], b[2], k)})`;
    const navColour = (t: number) =>
      t <= 0.5 ? mix(WHITE, GOLD, t * 2) : mix(GOLD, INK, (t - 0.5) * 2);

    const resetT = () => {
      root.style.setProperty("--page-t", "0");
      root.style.setProperty("--nav-col", "rgb(245, 245, 243)");
    };

    // The hero loader/intro owns the screen and, crucially, only creates its
    // pinned scroll-through (which inserts ~6.5 viewports of spacer) once it
    // finishes. Until then the Shop sits deceptively close to the top, so a
    // ScrollTrigger refresh fired mid-load reads a high `progress` and would
    // wrongly flip the theme to LIGHT — turning the nav ink-black and, when the
    // pin lands and progress snaps back to 0, reverse-tweening --page-t 1→0
    // (the white flash + black→white nav pop seen right after the loader).
    // While the loader/intro is up we simply refuse to flip: the page is always
    // the dark hero here, and the post-loader refresh re-evaluates with correct
    // geometry (progress 0 → stays dark) with nothing to undo.
    const loaderActive = () =>
      !!document.querySelector(".crisp-header.is--loading") ||
      document.body.classList.contains("is--intro-active");

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;

      const gsap = gsapMod.gsap ?? gsapMod.default;
      gsap.registerPlugin(ScrollTrigger);

      // ---- Premium CTA hover (GSAP) ------------------------------------
      // Gold fill sweeps in from the left, label + arrow invert to ink, the
      // arrow slides forward, and the whole pill magnetically leans toward the
      // cursor. A paused timeline played/reversed keeps enter+leave symmetric.
      const cta = ctaRef.current;
      if (cta && !prefersReduced) {
        const fill = cta.querySelector<HTMLElement>(".shop__cta-fill");
        const arrow = cta.querySelector<HTMLElement>(".shop__cta-arrow");

        // NB: label/arrow colour is handled in CSS (base = the inverting --_fg,
        // hover = ink). Tweening colour in JS bakes a stale inline value on
        // reverse, which then wins over the theme variable — the "stays white
        // in the light phase" bug. Keep GSAP to transform-only here.
        const hover = gsap
          .timeline({ paused: true, defaults: { ease: "power3.out" } })
          .to(fill, { scaleX: 1, duration: 0.5 }, 0)
          .to(arrow, { x: 6, duration: 0.45 }, 0);

        const enter = () => hover.play();
        const leave = () => {
          hover.reverse();
          gsap.to(cta, {
            x: 0,
            y: 0,
            duration: 0.7,
            ease: "elastic.out(1, 0.45)",
          });
        };
        const move = (e: MouseEvent) => {
          const r = cta.getBoundingClientRect();
          gsap.to(cta, {
            x: (e.clientX - (r.left + r.width / 2)) * 0.18,
            y: (e.clientY - (r.top + r.height / 2)) * 0.32,
            duration: 0.6,
            ease: "power3.out",
          });
        };

        cta.addEventListener("mouseenter", enter);
        cta.addEventListener("mouseleave", leave);
        cta.addEventListener("mousemove", move);
        detachCta = () => {
          cta.removeEventListener("mouseenter", enter);
          cta.removeEventListener("mouseleave", leave);
          cta.removeEventListener("mousemove", move);
          hover.kill();
          gsap.set(cta, { clearProps: "transform" });
        };
      }

      // Keep ScrollTrigger in lockstep with Lenis' interpolated scroll so the
      // colour scrub is buttery. The hero wires this too; a double update is
      // harmless.
      unsubLenis = onLenis((lenis) => {
        const onScroll = () => ScrollTrigger.update();
        lenis.on("scroll", onScroll);
        detachScroll = () => lenis.off("scroll", onScroll);
      });

      ctx = gsap.context(() => {
        // ---- Hysteresis flip (NOT a scrub) -------------------------------
        // Hold the previous section's DARK theme until the Shop is ~90% into
        // view, THEN animate to light; on the way back up keep it light until
        // only ~45% of the Shop is still visible, then animate back to dark.
        //
        // self.progress here == the Shop's visible fraction: the trigger spans
        // "top bottom" (Shop top at viewport bottom → 0% visible, progress 0)
        // to "top top" (Shop top at viewport top → 100% visible, progress 1),
        // and because the Shop is ~1 viewport tall that is a straight
        // progress == visibleFraction mapping. The two thresholds are just
        // progress values; the 0.45–0.90 gap is a deliberate hold band so the
        // theme is stable (no flicker) and the adjacent Story tail stays light
        // while you linger in the light Shop. Because --page-t is shared, the
        // previous/next section invert together — never a two-tone seam.
        const ENTER_LIGHT = 0.9; // ≥90% visible (scrolling down) → go light
        const EXIT_LIGHT = 0.45; // ≤45% visible (scrolling up)  → go dark

        const themeState = { t: 0 };
        let light = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let flip: any = null;

        const applyTheme = () => {
          const t = themeState.t;
          root.style.setProperty("--page-t", t.toFixed(4));
          root.style.setProperty("--nav-col", navColour(t));
          if (grain && !prefersReduced) {
            // Subtle always-on grain that swells across the flip then settles.
            grain.style.opacity = String(0.05 + Math.sin(t * Math.PI) * 0.26);
          }
        };

        const flipTo = (target: number) => {
          flip?.kill();
          flip = gsap.to(themeState, {
            t: target,
            duration: prefersReduced ? 0 : 0.8,
            ease: "power2.inOut",
            onUpdate: applyTheme,
            overwrite: true,
          });
        };

        const evaluate = (vf: number) => {
          // Hold the dark hero theme while the loader/intro is still on screen —
          // any refresh fired before the STA pin exists reads a false-high vf.
          if (loaderActive()) return;
          if (!light && vf >= ENTER_LIGHT) {
            light = true;
            flipTo(1);
          } else if (light && vf <= EXIT_LIGHT) {
            light = false;
            flipTo(0);
          }
        };

        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "top top",
          // Fire on creation/refresh too, so landing directly on the Shop (e.g.
          // via the Products nav link) evaluates the thresholds immediately.
          onRefresh: (self) => evaluate(self.progress),
          onUpdate: (self) => evaluate(self.progress),
        });

        ScrollTrigger.refresh();
      }, section);
    })();

    return () => {
      cancelled = true;
      unsubLenis();
      detachScroll();
      detachCta();
      ctx?.revert();
      resetT();
    };
  }, []);

  return (
    <section
      id="products"
      ref={sectionRef}
      className="shop"
      aria-label="Shop the collection"
    >
      {/* Fixed grain veil — full-viewport, inert; always-on subtle noise that
          pulses at the dark→light crossover (opacity scrubbed above). */}
      <div ref={grainRef} className="shop__grain" aria-hidden="true" />

      <div className="shop__inner">
        <div className="shop__head-row">
          <header className="shop__head">
            <h2 className="shop__title">The Collection</h2>
            <p className="shop__eyebrow">Shop</p>
          </header>

          <Link ref={ctaRef} href="/products" className="shop__cta">
            <span className="shop__cta-fill" aria-hidden="true" />
            <span className="shop__cta-label">Explore more products</span>
            <span className="shop__cta-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path
                  d="M4 12h15M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </div>

        <ul className="shop__grid">
          {PRODUCTS.map((product) => (
            <li key={product.id} className="shop-card">
              <div className="shop-card__media">
                <Link
                  href={`/product/${product.id}`}
                  className="shop-card__link"
                  aria-label={`View ${product.name} — ${product.detail}`}
                />
                <button type="button" className="shop-card__add">
                  Add to cart
                </button>
              </div>
              <div className="shop-card__meta">
                <h3 className="shop-card__name">{product.name}</h3>
                <div className="shop-card__line">
                  <p className="shop-card__detail">{product.detail}</p>
                  <p className="shop-card__price">{product.price}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="shop__note">
          Cold-pressed · bottled to order · shipped across Spain &amp; the EU
        </p>
      </div>
    </section>
  );
}
