"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import { useLocale } from "@/components/LocaleContext/LocaleContext";
import "./products.css";
import { useCart } from "@/components/Cart/CartContext";
import { getCatalogEntry } from "@/lib/products";
import { CURTAIN_REVEAL_EVENT } from "@/components/RouteCurtain/curtainNav";

/* ------------------------------------------------------------------ */
/* Products listing — LIGHT (§7, the Shop gets out of the way).         */
/*                                                                     */
/* Fetches products from the API and displays them. Falls back to      */
/* static products if the API is unreachable.                          */
/* ------------------------------------------------------------------ */

type Tile = {
  id: string;
  nameKey: string;
  detailKey: string;
  price: string;
  image?: string;
};

type LiveProduct = {
  slug: string;
  name: string;
  subtitle: string;
  images: string[];
  sizes: Array<{
    id: string;
    label: string;
    price: number;
  }>;
  defaultSizeId: string;
};

// Static fallback — shown if the API is unreachable or returns no products
const FALLBACK_TILES: Tile[] = [
  { id: "single", nameKey: "shop.product_single", detailKey: "shop.detail_single", price: "€35", image: "/products/11.webp" },
  { id: "duo", nameKey: "shop.product_duo", detailKey: "shop.detail_duo", price: "€66", image: "/products/2.webp" },
  { id: "two-litre", nameKey: "shop.product_twolitre", detailKey: "shop.detail_twolitre", price: "€16", image: "/products/4.webp" },
];

export default function ProductsPage() {
  const { t } = useLocale();
  const rootRef = useRef<HTMLElement>(null);

  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tiles, setTiles] = useState<Tile[]>(FALLBACK_TILES);
  const [loading, setLoading] = useState(true);

  // Fetch products from the API
  useEffect(() => {
    let alive = true;
    fetch("/api/proxy/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { products?: LiveProduct[] } | null) => {
        if (!alive) return;
        setLoading(false);
        if (!d?.products?.length) return;

        // Convert API products to tiles
        setTiles(
          d.products.map((p) => {
            const size =
              p.sizes.find((s) => s.id === p.defaultSizeId) ?? p.sizes[0];
            return {
              id: p.slug,
              nameKey: p.name,
              detailKey: p.subtitle,
              price: size ? `€${size.price}` : "",
              image: p.images[0],
            };
          })
        );
      })
      .catch(() => {
        setLoading(false);
        /* keep the static fallback */
      });
    return () => {
      alive = false;
    };
  }, []);

  const quickAdd = (id: string) => {
    const entry = getCatalogEntry(id);
    if (!entry) return;
    const { product, qty } = entry;
    const size =
      product.sizes.find((s) => s.id === product.defaultSizeId) ??
      product.sizes[0];
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
    setAddedId(id);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedId(null), 1600);
  };

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  /* ---- Light theme: pin the shop inversion + ink nav on this route ---
     Same treatment as the PDP — the Shop is the site's white mode. */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-t", "1");
    root.style.setProperty("--nav-col", "rgb(20, 22, 15)");
    return () => {
      root.style.setProperty("--page-t", "0");
      root.style.setProperty("--nav-col", "rgb(245, 245, 243)");
    };
  }, []);

  /* ---- Entrance — rise-and-fade, timed to the curtain reveal when one
     is running (client navigation), immediate on a hard load. ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    let offReveal: (() => void) | null = null;

    (async () => {
      const gsapMod = await import("gsap");
      if (cancelled) return;
      const gsap = gsapMod.gsap ?? gsapMod.default;

      ctx = gsap.context(() => {
        const play = () => {
          gsap
            .timeline({ defaults: { ease: "expo.out", duration: 1.1 } })
            .fromTo(
              "[data-rise]",
              { autoAlpha: 0, y: 26 },
              { autoAlpha: 1, y: 0, stagger: 0.08 },
              0
            )
            .fromTo(
              "[data-tile]",
              { autoAlpha: 0, y: 34 },
              { autoAlpha: 1, y: 0, stagger: 0.1, duration: 1.2 },
              0.15
            );
        };
        // Hide immediately so nothing flashes before the entrance.
        gsap.set("[data-rise], [data-tile]", { autoAlpha: 0 });
        const onReveal = () => play();
        window.addEventListener(CURTAIN_REVEAL_EVENT, onReveal, { once: true });
        offReveal = () =>
          window.removeEventListener(CURTAIN_REVEAL_EVENT, onReveal);
        // Hard load / curtain-exempt arrival: no reveal event will fire —
        // play after a beat if it hasn't already.
        const t = window.setTimeout(() => {
          offReveal?.();
          play();
        }, 700);
        return () => window.clearTimeout(t);
      }, root);
    })();

    return () => {
      cancelled = true;
      offReveal?.();
      ctx?.revert();
    };
  }, []);

  return (
    <main data-main className="products" ref={rootRef}>
      <div className="products__inner">
        <div className="products__head-row" data-rise>
          <header className="products__head">
            <h1 className="products__title">{t("shop.title")}</h1>
            <p className="products__eyebrow">{t("shop.eyebrow")}</p>
          </header>

          {/* B2B — bulk / trade enquiries route to the contact page. */}
          <LocaleLink href="/contact" className="products__b2b">
            <span className="products__b2b-label">{t("shop.b2b")}</span>
            <span className="products__b2b-arrow" aria-hidden="true">
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
          </LocaleLink>
        </div>

        <ul className="products__grid">
          {tiles.map((tile) => (
            <li key={tile.id} className="pcard" data-tile>
              <div className="pcard__media">
                {tile.image && (
                  <img
                    src={tile.image}
                    alt=""
                    className="pcard__img"
                    aria-hidden="true"
                  />
                )}
                <LocaleLink
                  href={`/product/${tile.id}`}
                  className="pcard__link"
                  aria-label={typeof tile.nameKey === 'string' && tile.nameKey.startsWith('shop.') ? `${t(tile.nameKey)}, ${t(tile.detailKey)}` : `${tile.nameKey}, ${tile.detailKey}`}
                />
                <button
                  type="button"
                  className="pcard__add"
                  onClick={() => quickAdd(tile.id)}
                >
                  {addedId === tile.id ? t("shop.added") : t("shop.add")}
                </button>
              </div>
              <div className="pcard__meta">
                <h2 className="pcard__name">{typeof tile.nameKey === 'string' && tile.nameKey.startsWith('shop.') ? t(tile.nameKey) : tile.nameKey}</h2>
                <div className="pcard__line">
                  <p className="pcard__detail">{typeof tile.detailKey === 'string' && tile.detailKey.startsWith('shop.') ? t(tile.detailKey) : tile.detailKey}</p>
                  <p className="pcard__price">{tile.price}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="products__note" data-rise>
          {t("shop.note")}
        </p>
      </div>
    </main>
  );
}
