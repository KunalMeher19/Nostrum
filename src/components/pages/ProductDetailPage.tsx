"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "./product.css"; // Styles for the product detail page
import SiteFooter from "@/components/SiteFooter/SiteFooter";
import { useCart } from "@/components/Cart/CartContext";
import { getLenis } from "@/components/SmoothScroll/lenisStore";
import { useLocale } from "@/components/LocaleContext/LocaleContext";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import {
  formatEuro,
  getCatalogEntry,
  lineTotal,
  tierFor,
  type Product,
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

const TAB_KEYS = ["tab_description", "tab_details", "tab_shipping"] as const;
type TabKey = (typeof TAB_KEYS)[number];

type LiveProduct = {
  slug: string;
  name: string;
  subtitle: string;
  images: string[];
  sizes: Array<{ id: string; label: string; price: number }>;
  defaultSizeId: string;
  packs?: Array<{ qty: number; discount: number }>;
};

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useLocale();
  const id = params?.id ?? "";
  const entry = getCatalogEntry(id);
  const product = entry?.product ?? null;

  const { addItem } = useCart();

  const [sizeId, setSizeId] = useState(product?.defaultSizeId ?? "");
  const [oilTypeId, setOilTypeId] = useState<string | null>(null);
  const [photoVariantIdx, setPhotoVariantIdx] = useState(0);
  const [qty, setQty] = useState(entry?.qty ?? 1);
  const [customQty, setCustomQty] = useState(false);
  const [added, setAdded] = useState(false);
  const [liveProduct, setLiveProduct] = useState<Product | null>(null);

  const rootRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve live products by slug first; static aliases remain the fallback.
  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetch("/api/proxy/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { products?: LiveProduct[] } | null) => {
        const p = data?.products?.find((item) => item.slug === id);
        if (!alive || !p || !p.sizes?.length) return;
        const size = p.sizes.find((s: any) => s.id === p.defaultSizeId) ?? p.sizes[0];
        // Convert API product to internal Product format
        setLiveProduct({
          slug: p.slug,
          name: p.name,
          subtitle: p.subtitle,
          category: "Olive Oil",
          sizes: p.sizes.map((s: any) => ({
            id: s.id,
            label: s.label,
            price: s.price,
            image: p.images[0],
          })),
          defaultSizeId: p.defaultSizeId ?? size.id,
          packs: p.packs ?? [
            { qty: 1, discount: 0 },
            { qty: 2, discount: 0.05 },
            { qty: 3, discount: 0.1 },
          ],
          description: [],
          details: [],
          shipping: [],
          highlights: [],
          views: [],
        });
        setSizeId(size.id);
        setQty(1);
      })
      .catch(() => {
        // Product not found
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const activeProduct = liveProduct ?? product;

  // Reset oil type selection when size changes
  useEffect(() => {
    setOilTypeId(null);
    setPhotoVariantIdx(0);
  }, [sizeId]);

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
    if (!root || !activeProduct) return;
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
  }, [activeProduct?.slug]);

  /* ---- Spotlight sticky — image scrolls, panel sticks (≥900px) -------- */
  /* Mirrors StorySection's spotlight sticky: transform-driven via
     ScrollTrigger onUpdate rather than CSS position:sticky, which
     misbehaves under Lenis + the transformed [data-main]. On mobile
     (<900px) the grid collapses to a single column and the panel stacks
     normally below the image — no sticky needed. */
  const PDP_STICKY_TOP = 96; // px — clear of the fixed nav
  useEffect(() => {
    const grid = gridRef.current;
    const panel = panelRef.current;
    if (!grid || !panel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;

    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap: any = (gsapMod as any).gsap ?? (gsapMod as any).default;
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 901px)", () => {
          const st = ScrollTrigger.create({
            trigger: grid,
            start: () => `top ${PDP_STICKY_TOP}`,
            end: () => `bottom ${PDP_STICKY_TOP + panel.offsetHeight}`,
            onUpdate(self: { progress: number; start: number; end: number }) {
              gsap.set(panel, {
                y: self.progress * Math.max(0, self.end - self.start),
              });
            },
            invalidateOnRefresh: true,
          });
          return () => {
            st.kill();
            gsap.set(panel, { y: 0 });
          };
        });
      }, grid);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [activeProduct?.slug]);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const [tab, setTab] = useState<TabKey>("tab_description");

  const size = useMemo(
    () => activeProduct?.sizes.find((s) => s.id === sizeId) ?? activeProduct?.sizes[0],
    [activeProduct, sizeId]
  );

  if (!activeProduct || !size) {
    return (
      <main data-main className="pdp pdp--missing">
        <div className="pdp-missing">
          <p className="pdp-missing__eyebrow">{t("product.missing_eyebrow")}</p>
          <h1 className="pdp-missing__title">{t("product.missing_title")}</h1>
          <p className="pdp-missing__note">
            {t("product.missing_note")}
          </p>
          <LocaleLink href="/#products" className="pdp-missing__back">
            {t("product.missing_back")}
          </LocaleLink>
        </div>
      </main>
    );
  }

  const tier = tierFor(activeProduct, qty);
  const total = lineTotal(activeProduct, size.id, qty);

  const doAdd = (opts?: { openDrawer?: boolean }) => {
    addItem(
      {
        slug: activeProduct.slug,
        name: activeProduct.name,
        subtitle: t("product.subtitle"),
        sizeId: size.id,
        sizeLabel: size.label,
        image: size.image,
      },
      qty,
      opts
    );
  };

  const handleAdd = () => {
    doAdd();
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    // Straight to the full cart — no drawer flash on the way out.
    doAdd({ openDrawer: false });
    router.push(`/${locale}/cart`);
  };

  /* Translated product data — pulled from the "product" translation section */
  const descriptions = [t("product.desc_1"), t("product.desc_2")];
  const details = [
    { label: t("product.detail_variety"), value: t("product.detail_variety_value") },
    { label: t("product.detail_extraction"), value: t("product.detail_extraction_value") },
    { label: t("product.detail_acidity"), value: t("product.detail_acidity_value") },
    { label: t("product.detail_origin"), value: t("product.detail_origin_value") },
    { label: t("product.detail_keep"), value: t("product.detail_keep_value") },
  ];
  const shippingLines = [t("product.shipping_1"), t("product.shipping_2"), t("product.shipping_3")];
  const highlights = [
    t("product.highlight_1"),
    t("product.highlight_2"),
    t("product.highlight_3"),
    t("product.highlight_4"),
    t("product.highlight_5"),
  ];

  return (
    <main data-main className="pdp" ref={rootRef}>
      <div className="pdp__inner">
        {/* ---- Breadcrumb ------------------------------------------- */}
        <nav className="pdp__crumb" aria-label="Breadcrumb" data-rise>
          <LocaleLink href="/#products">{t("product.breadcrumb_shop")}</LocaleLink>
          <span aria-hidden="true">/</span>
          <span>{t("product.category")}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{size.label}</span>
        </nav>

        <div className="pdp__grid" ref={gridRef}>
          {/* Gallery — real product photos */}
          <section className="pdp__gallery" aria-label="Product image">
            <div className="pdp__media" data-unveil>
              {(() => {
                const currentSize = activeProduct.sizes.find(s => s.id === sizeId) ?? activeProduct.sizes[0];
                const oilType = currentSize.oilTypes?.find(o => o.id === oilTypeId) ?? currentSize.oilTypes?.[0];
                const mainImg = oilType?.image ?? (photoVariantIdx === 1 && currentSize.altImage ? currentSize.altImage : currentSize.image);
                if (mainImg) {
                  return (
                    <div className="pdp__media-photo">
                      <img src={mainImg} alt={`${activeProduct.name} ${currentSize.label}`} />
                    </div>
                  );
                }
                return (
                  <div className="pdp__media-tile">
                    <span className="pdp__media-mark" aria-hidden="true">N</span>
                    <span className="pdp__media-view">{t("product.view_bottle")}</span>
                  </div>
                );
              })()}
              {/* Photo variant toggle for 5L (two photos) */}
              {(() => {
                const currentSize = activeProduct.sizes.find(s => s.id === sizeId) ?? activeProduct.sizes[0];
                if (!currentSize.oilTypes && currentSize.altImage) {
                  return (
                    <div className="pdp__photo-toggle">
                      <button
                        type="button"
                        className={`pdp__photo-dot${photoVariantIdx === 0 ? " is--active" : ""}`}
                        onClick={() => setPhotoVariantIdx(0)}
                        aria-label="Photo 1"
                      />
                      <button
                        type="button"
                        className={`pdp__photo-dot${photoVariantIdx === 1 ? " is--active" : ""}`}
                        onClick={() => setPhotoVariantIdx(1)}
                        aria-label="Photo 2"
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </section>

          {/* ---- Details column -------------------------------------- */}
          <section className="pdp__panel" aria-label="Product details" ref={panelRef}>
            <header className="pdp__head" data-rise>
              <h1 className="pdp__name">{activeProduct.name}</h1>
              <p className="pdp__subtitle">{t("product.subtitle")}</p>
            </header>

            <p className="pdp__price" data-rise>
              <span className="pdp__price-value">{formatEuro(size.price)}</span>
              <span className="pdp__price-note">{t("product.plus_shipping")}</span>
            </p>

            {/* ---- Size — segmented (premium over a native dropdown) --- */}
            <fieldset className="pdp__field" data-rise>
              <legend className="pdp__label">{t("product.size")}</legend>
              <div className="pdp__segments" role="radiogroup" aria-label={t("product.size")}>
                {activeProduct.sizes.map((s) => (
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

            {/* ---- Oil type selector — shown only for 2L --------- */}
            {size.oilTypes && size.oilTypes.length > 0 && (
              <fieldset className="pdp__field" data-rise>
                <legend className="pdp__label">{t("product.oil_type")}</legend>
                <div className="pdp__segments" role="radiogroup" aria-label={t("product.oil_type")}>
                  {size.oilTypes.map((ot) => {
                    const active = (oilTypeId ?? size.oilTypes![0].id) === ot.id;
                    return (
                      <button
                        key={ot.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`pdp__segment${active ? " is--active" : ""}`}
                        onClick={() => setOilTypeId(ot.id)}
                      >
                        {ot.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* ---- Quantity — ×1/×2/×3 tiers + free custom amount ------ */}
            <fieldset className="pdp__field" data-rise>
              <legend className="pdp__label">{t("product.quantity")}</legend>
              <div
                className="pdp__segments"
                role="radiogroup"
                aria-label={t("product.quantity")}
              >
                {activeProduct.packs.map((p) => {
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
                  {t("product.custom")}
                </button>
              </div>
              {customQty && (
                <div className="pdp__custom">
                  <label className="pdp__custom-label" htmlFor="pdp-qty">
                    {t("product.amount")}
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
                      −{Math.round(tier.discount * 100)}% {t("product.discount_applied")}
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
                  {added ? t("product.added_to_cart") : t("product.add_to_cart")}
                </span>
                <span className="pdp__add-price">
                  {added ? "✓" : formatEuro(total)}
                </span>
              </button>
              <button type="button" className="pdp__buy" onClick={handleBuyNow}>
                {t("product.buy_now")}
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
                  {t("product.fast_shipping")}
                  <small>{t("product.fast_shipping_detail")}</small>
                </span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.2" />
                  <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" />
                </svg>
                <span>
                  {t("product.secure_payment")}
                  <small>{t("product.secure_payment_detail")}</small>
                </span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9a8.2 8.2 0 0 1 15.5 2.5A8.2 8.2 0 0 1 5 16.5" />
                  <path d="M4 4.5V9h4.5" />
                </svg>
                <span>
                  {t("product.returns")}
                  <small>{t("product.returns_detail")}</small>
                </span>
              </li>
            </ul>

            {/* ---- B2B enquiry link ----------------------------------- */}
            <div className="pdp__b2b-row" data-fade>
              <LocaleLink href="/contact" className="pdp__b2b-link">
                {t("product.b2b_enquiry")}
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true">
                  <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </LocaleLink>
            </div>
          </section>
        </div>

        {/* ---- Tabs + highlights ------------------------------------- */}
        <div className="pdp__below" data-fade>
          <section className="pdp__tabs-block" aria-label="More information">
            <div className="pdp__tabs" role="tablist">
              {TAB_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  className={`pdp__tab${tab === k ? " is--active" : ""}`}
                  onClick={() => setTab(k)}
                >
                  {t(`product.${k}`)}
                </button>
              ))}
            </div>
            <div className="pdp__tabpanel" role="tabpanel" key={tab}>
              {tab === "tab_description" &&
                descriptions.map((p) => <p key={p}>{p}</p>)}
              {tab === "tab_details" && (
                <dl className="pdp__details">
                  {details.map((d) => (
                    <div key={d.label}>
                      <dt>{d.label}</dt>
                      <dd>{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {tab === "tab_shipping" &&
                shippingLines.map((p) => <p key={p}>{p}</p>)}
            </div>
          </section>

          <aside className="pdp__highlights" aria-label={t("product.highlights_title")}>
            <h2 className="pdp__label">{t("product.highlights_title")}</h2>
            <ul>
              {highlights.map((h) => (
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
