"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "./product.css";
import SiteFooter from "@/components/SiteFooter/SiteFooter";
import { useCart } from "@/components/Cart/CartContext";
import { getLenis } from "@/components/SmoothScroll/lenisStore";
import {
  formatEuro,
  getCatalogEntry,
  lineTotal,
  tierFor,
} from "@/lib/products";

/* ------------------------------------------------------------------ */
/* Product page — LIGHT/white (§7), LV/Balmain-clean.                   */
/*                                                                     */
/* Layout follows the client's mock: breadcrumb · big image + thumbnail */
/* gallery LEFT · name / €price / size / quantity packs / add-to-cart / */
/* buy-now / trust badges RIGHT · tabs + highlights below. The route is */
/* dynamic: /product/single|duo|trio all resolve to the 5L oil with the */
/* matching pack (×1/×2/×3) preselected — the catalog stays flexible    */
/* for future product types. Quantity is never capped: the ×1/×2/×3     */
/* tiers sit next to a free custom amount ("don't limit the client").   */
/* Media are the Collection's warm N-monogram placeholder tiles until   */
/* real photography drops in. Entrance: quiet GSAP fade-rise + a        */
/* clip-path unveil on the hero tile; reduced-motion skips it all.      */
/* ------------------------------------------------------------------ */

const TABS = ["Description", "Details", "Shipping"] as const;
type Tab = (typeof TABS)[number];

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const entry = getCatalogEntry(id);
  const product = entry?.product ?? null;

  const { addItem } = useCart();

  const [sizeId, setSizeId] = useState(product?.defaultSizeId ?? "");
  const [qty, setQty] = useState(entry?.qty ?? 1);
  const [customQty, setCustomQty] = useState(false);
  const [view, setView] = useState(0);
  const [added, setAdded] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Light theme: pin the shop inversion + ink nav on this route --- */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-t", "1");
    root.style.setProperty("--nav-col", "rgb(20, 22, 15)");
    // This route is exempt from the RouteCurtain (instant Shop flow), so the
    // scroll reset the drape normally performs after the route settles has to
    // happen here: snap Lenis to the top and make sure it's running (it can
    // arrive stopped when the click came from the hero-locked landing page).
    const lenis = getLenis();
    if (sessionStorage.getItem("nostrum_fresh_nav") === "true") {
      sessionStorage.removeItem("nostrum_fresh_nav");
      lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    }
    lenis?.start();
    return () => {
      root.style.setProperty("--page-t", "0");
      root.style.setProperty("--nav-col", "rgb(245, 245, 243)");
    };
  }, []);

  /* ---- Entrance choreography (GSAP, reduced-motion-safe) ------------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !product) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    // No curtain runs to this route (it's exempt — instant Shop flow), so the
    // entrance plays straight away on both hard loads and client navigations.
    // The choreography itself IS the arrival moment.
    (async () => {
      const gsapMod = await import("gsap");
      if (cancelled) return;
      const gsap = gsapMod.gsap ?? gsapMod.default;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: "expo.out", duration: 1.1 },
        });
        tl.fromTo(
          "[data-unveil]",
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 1.3 },
          0
        )
          .fromTo(
            "[data-rise]",
            { autoAlpha: 0, y: 26 },
            { autoAlpha: 1, y: 0, stagger: 0.07 },
            0.15
          )
          .fromTo(
            "[data-fade]",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.9, stagger: 0.05 },
            0.55
          );
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // Entrance runs once per product route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug]);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const [tab, setTab] = useState<Tab>("Description");

  const size = useMemo(
    () => product?.sizes.find((s) => s.id === sizeId) ?? product?.sizes[0],
    [product, sizeId]
  );

  if (!product || !size) {
    return (
      <main data-main className="pdp pdp--missing">
        <div className="pdp-missing">
          <p className="pdp-missing__eyebrow">Shop</p>
          <h1 className="pdp-missing__title">Not part of the collection</h1>
          <p className="pdp-missing__note">
            This product doesn&rsquo;t exist — or isn&rsquo;t bottled yet.
          </p>
          <Link href="/#products" className="pdp-missing__back">
            ← Back to the collection
          </Link>
        </div>
      </main>
    );
  }

  const tier = tierFor(product, qty);
  const total = lineTotal(product, size.id, qty);

  const doAdd = () => {
    addItem(
      {
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        sizeId: size.id,
        sizeLabel: size.label,
      },
      qty
    );
  };

  const handleAdd = () => {
    doAdd();
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    doAdd();
    router.push("/cart");
  };

  return (
    <main data-main className="pdp" ref={rootRef}>
      <div className="pdp__inner">
        {/* ---- Breadcrumb ------------------------------------------- */}
        <nav className="pdp__crumb" aria-label="Breadcrumb" data-rise>
          <Link href="/#products">Shop</Link>
          <span aria-hidden="true">/</span>
          <span>{product.category}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{size.label}</span>
        </nav>

        <div className="pdp__grid">
          {/* ---- Gallery — big tile + thumbnails --------------------- */}
          <section className="pdp__gallery" aria-label="Product images">
            <div className="pdp__media" data-unveil>
              {/* Placeholder tiles (Collection-style N monogram) — real
                  photography drops straight in here later. Keyed so each
                  view swap re-runs the crossfade. */}
              <div className="pdp__media-tile" key={view}>
                <span className="pdp__media-mark" aria-hidden="true">
                  N
                </span>
                <span className="pdp__media-view">{product.views[view]}</span>
              </div>
            </div>
            <div
              className="pdp__thumbs"
              role="tablist"
              aria-label="Gallery views"
              data-fade
            >
              {product.views.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={view === i}
                  aria-label={label}
                  className={`pdp__thumb${view === i ? " is--active" : ""}`}
                  onClick={() => setView(i)}
                >
                  <span aria-hidden="true">N</span>
                </button>
              ))}
            </div>
          </section>

          {/* ---- Details column -------------------------------------- */}
          <section className="pdp__panel" aria-label="Product details">
            <header className="pdp__head" data-rise>
              <h1 className="pdp__name">{product.name}</h1>
              <p className="pdp__subtitle">{product.subtitle}</p>
            </header>

            <p className="pdp__price" data-rise>
              <span className="pdp__price-value">{formatEuro(size.price)}</span>
              <span className="pdp__price-note">+ shipping</span>
            </p>

            {/* ---- Size — segmented (premium over a native dropdown) --- */}
            <fieldset className="pdp__field" data-rise>
              <legend className="pdp__label">Size</legend>
              <div className="pdp__segments" role="radiogroup" aria-label="Size">
                {product.sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={size.id === s.id}
                    className={`pdp__segment${size.id === s.id ? " is--active" : ""}`}
                    onClick={() => setSizeId(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* ---- Quantity — ×1/×2/×3 tiers + free custom amount ------ */}
            <fieldset className="pdp__field" data-rise>
              <legend className="pdp__label">Quantity</legend>
              <div
                className="pdp__segments"
                role="radiogroup"
                aria-label="Quantity"
              >
                {product.packs.map((p) => {
                  const active = !customQty && qty === p.qty;
                  return (
                    <button
                      key={p.qty}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`pdp__segment pdp__segment--pack${active ? " is--active" : ""}`}
                      onClick={() => {
                        setCustomQty(false);
                        setQty(p.qty);
                      }}
                    >
                      ×{p.qty}
                      {p.discount > 0 && (
                        <em>−{Math.round(p.discount * 100)}%</em>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  role="radio"
                  aria-checked={customQty}
                  className={`pdp__segment pdp__segment--pack${customQty ? " is--active" : ""}`}
                  onClick={() => setCustomQty(true)}
                >
                  Custom
                </button>
              </div>
              {customQty && (
                <div className="pdp__custom">
                  <label className="pdp__custom-label" htmlFor="pdp-qty">
                    Amount
                  </label>
                  <input
                    id="pdp-qty"
                    className="pdp__custom-input"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={qty}
                    autoFocus
                    onChange={(e) => {
                      const v = Math.floor(Number(e.target.value));
                      setQty(Number.isFinite(v) && v > 0 ? v : 1);
                    }}
                  />
                  {tier.discount > 0 && (
                    <span className="pdp__custom-tier">
                      −{Math.round(tier.discount * 100)}% applied
                    </span>
                  )}
                </div>
              )}
            </fieldset>

            {/* ---- CTAs ------------------------------------------------ */}
            <div className="pdp__ctas" data-rise>
              <button
                type="button"
                className={`pdp__add${added ? " is--added" : ""}`}
                onClick={handleAdd}
              >
                <span className="pdp__add-fill" aria-hidden="true" />
                <span className="pdp__add-label">
                  {added ? "Added to cart" : "Add to cart"}
                </span>
                <span className="pdp__add-price">
                  {added ? "✓" : formatEuro(total)}
                </span>
              </button>
              <button type="button" className="pdp__buy" onClick={handleBuyNow}>
                Buy now
              </button>
            </div>

            {/* ---- Trust badges ---------------------------------------- */}
            <ul className="pdp__trust" data-fade>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M1.5 5.5h12v11h-12zM13.5 9h4.2l3.3 3.5v4h-7.5" />
                  <circle cx="6" cy="18.5" r="1.8" />
                  <circle cx="17.5" cy="18.5" r="1.8" />
                </svg>
                <span>
                  Fast shipping
                  <small>2–4 days</small>
                </span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.2" />
                  <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" />
                </svg>
                <span>
                  Secure payment
                  <small>SSL encrypted</small>
                </span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9a8.2 8.2 0 0 1 15.5 2.5A8.2 8.2 0 0 1 5 16.5" />
                  <path d="M4 4.5V9h4.5" />
                </svg>
                <span>
                  14-day returns
                  <small>Money back</small>
                </span>
              </li>
            </ul>
          </section>
        </div>

        {/* ---- Tabs + highlights ------------------------------------- */}
        <div className="pdp__below" data-fade>
          <section className="pdp__tabs-block" aria-label="More information">
            <div className="pdp__tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  className={`pdp__tab${tab === t ? " is--active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="pdp__tabpanel" role="tabpanel" key={tab}>
              {tab === "Description" &&
                product.description.map((p) => <p key={p}>{p}</p>)}
              {tab === "Details" && (
                <dl className="pdp__details">
                  {product.details.map((d) => (
                    <div key={d.label}>
                      <dt>{d.label}</dt>
                      <dd>{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {tab === "Shipping" &&
                product.shipping.map((p) => <p key={p}>{p}</p>)}
            </div>
          </section>

          <aside className="pdp__highlights" aria-label="Product highlights">
            <h2 className="pdp__label">Product highlights</h2>
            <ul>
              {product.highlights.map((h) => (
                <li key={h}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4.5 12.5l5 5 10-11" />
                  </svg>
                  {h}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
