"use client";

import { useEffect, useRef } from "react";
import "./cart.css";
import { useCart } from "@/components/Cart/CartContext";
import { useLocale } from "@/components/LocaleContext/LocaleContext";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import { CURTAIN_REVEAL_EVENT } from "@/components/RouteCurtain/curtainNav";
import {
  COLLECTION_TILES,
  formatEuro,
  getProduct,
  lineTotal,
  sizeImage,
  tierFor,
  tileImage,
  tilePrice,
} from "@/lib/products";

/* ------------------------------------------------------------------ */
/* Cart — LIGHT/white (§7 flow: product → cart → checkout), LV-clean.   */
/* Editorial head, ledger of line items LEFT, order summary panel       */
/* RIGHT (sticky on desktop). Checkout stays quietly disabled until     */
/* payments land (§1.1). The empty cart is an invitation, not a dead    */
/* end: editorial line + Shop CTA + the collection trio as suggestion   */
/* cards. Entrance follows the listing page's pattern — timed to the    */
/* curtain reveal on client navs, immediate-ish on hard loads.          */
/* ------------------------------------------------------------------ */

export default function CartPage() {
  const { items, count, subtotal, setQty, removeItem } = useCart();
  const { t } = useLocale();
  const rootRef = useRef<HTMLElement>(null);

  /* ---- Light theme: pin the shop inversion + ink nav on this route --- */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-t", "1");
    root.style.setProperty("--nav-col", "rgb(20, 22, 15)");
    return () => {
      root.style.setProperty("--page-t", "0");
      root.style.setProperty("--nav-col", "rgb(245, 245, 243)");
    };
  }, []);

  /* ---- Entrance — rise-and-fade, curtain-synced (same as /products) --- */
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
            );
        };
        gsap.set("[data-rise]", { autoAlpha: 0 });
        const onReveal = () => play();
        window.addEventListener(CURTAIN_REVEAL_EVENT, onReveal, { once: true });
        offReveal = () =>
          window.removeEventListener(CURTAIN_REVEAL_EVENT, onReveal);
        const timer = window.setTimeout(() => {
          offReveal?.();
          play();
        }, 700);
        return () => window.clearTimeout(timer);
      }, root);
    })();

    return () => {
      cancelled = true;
      offReveal?.();
      ctx?.revert();
    };
    // Re-run when the cart flips between empty and filled — the two states
    // render different [data-rise] trees.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length === 0]);

  return (
    <main data-main className="cart" ref={rootRef}>
      <div className="cart__inner">
        <header className="cart__head" data-rise>
          <p className="cart__eyebrow">{t("cart.eyebrow")}</p>
          <h1 className="cart__title">{t("cart.title")}</h1>
          {count > 0 && (
            <p className="cart__count">
              {count} {count === 1 ? t("cart.item") : t("cart.items")}
            </p>
          )}
        </header>

        {items.length === 0 ? (
          /* ---- Empty: an invitation into the Shop -------------------- */
          <div className="cart__empty">
            <div className="cart__empty-lede" data-rise>
              <p className="cart__empty-title">{t("cart.empty_title")}</p>
              <p className="cart__empty-note">{t("cart.empty_note")}</p>
              <LocaleLink href="/products" className="cart__empty-cta">
                {t("cart.empty_cta")}
              </LocaleLink>
            </div>

            <div className="cart__suggest" data-rise>
              <p className="cart__suggest-eyebrow">
                {t("cart.suggest_eyebrow")}
              </p>
              <ul className="cart__suggest-grid">
                {COLLECTION_TILES.map((tile) => {
                  const price = tilePrice(tile.id);
                  const image = tileImage(tile.id);
                  return (
                    <li key={tile.id}>
                      <LocaleLink
                        href={`/product/${tile.id}`}
                        className="cart__suggest-card"
                      >
                        <span className="cart__suggest-media" aria-hidden="true">
                          {image ? <img src={image} alt="" /> : "N"}
                        </span>
                        <span className="cart__suggest-name">
                          {t(tile.nameKey)}
                        </span>
                        <span className="cart__suggest-line">
                          <span className="cart__suggest-detail">
                            {t(tile.detailKey)}
                          </span>
                          {price !== null && (
                            <span className="cart__suggest-price">
                              {formatEuro(price)}
                            </span>
                          )}
                        </span>
                      </LocaleLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : (
          <div className="cart__layout">
            {/* ---- Line items -------------------------------------- */}
            <ul className="cart__list" data-rise>
              {items.map((it) => {
                const product = getProduct(it.slug);
                if (!product) return null;
                const total = lineTotal(product, it.sizeId, it.qty);
                const tier = tierFor(product, it.qty);
                const image = sizeImage(product, it.sizeId);
                return (
                  <li key={it.key} className="cart__row">
                    <div className="cart__row-media" aria-hidden="true">
                      {image ? <img src={image} alt="" /> : "N"}
                    </div>
                    <div className="cart__row-info">
                      <p className="cart__row-name">{it.name}</p>
                      <p className="cart__row-size">
                        {it.subtitle} · {it.sizeLabel}
                        {tier.discount > 0 && (
                          <em> · −{Math.round(tier.discount * 100)}%</em>
                        )}
                      </p>
                      <button
                        type="button"
                        className="cart__row-remove"
                        onClick={() => removeItem(it.key)}
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                    <div
                      className="cart__row-qty"
                      aria-label={t("product.quantity")}
                    >
                      <button
                        type="button"
                        aria-label={t("cart.qty_minus")}
                        onClick={() => setQty(it.key, it.qty - 1)}
                      >
                        −
                      </button>
                      <span>{it.qty}</span>
                      <button
                        type="button"
                        aria-label={t("cart.qty_plus")}
                        onClick={() => setQty(it.key, it.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="cart__row-price">{formatEuro(total)}</p>
                  </li>
                );
              })}
            </ul>

            {/* ---- Order summary ------------------------------------ */}
            <aside className="cart__summary" data-rise>
              <div className="cart__summary-panel">
                <p className="cart__summary-eyebrow">{t("cart.subtotal")}</p>
                <p className="cart__summary-total">{formatEuro(subtotal)}</p>
                <p className="cart__note">{t("cart.shipping_note")}</p>
                <button type="button" className="cart__checkout" disabled>
                  {t("cart.checkout")}
                  <span>{t("cart.checkout_soon")}</span>
                </button>
                <LocaleLink href="/products" className="cart__shop-more">
                  {t("cart.add_more")}
                </LocaleLink>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
