  "use client";

import { useEffect, useRef, useState } from "react";
import "./cart.css";
import { useCart } from "@/components/Cart/CartContext";
import { useLocale } from "@/components/LocaleContext/LocaleContext";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import { startCheckout } from "@/lib/api";
import {
  CURTAIN_REVEAL_EVENT,
} from "@/components/RouteCurtain/curtainNav";
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
/* RIGHT (sticky on desktop). Checkout calls /api/checkout → Stripe    */
/* hosted UI. The empty cart is an invitation, not a dead end.          */
/* ------------------------------------------------------------------ */

export default function CartPage() {
  const { items, count, subtotal, isHydrated, setQty, removeItem } = useCart();
  const { t, locale } = useLocale();
  const rootRef = useRef<HTMLElement>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const checkoutInProgressRef = useRef(false);

  async function handleCheckout() {
    // Prevent multiple simultaneous checkout attempts
    if (checkoutInProgressRef.current || checkoutLoading || items.length === 0) {
      return;
    }

    checkoutInProgressRef.current = true;
    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const payload = items.map((it) => ({
        slug: it.slug,
        sizeId: it.sizeId,
        qty: it.qty,
      }));
      const { url } = await startCheckout(payload, locale);
      // Redirect to Stripe's hosted checkout page.
      // Note: idempotency is handled inside startCheckout, so even if
      // this function is called multiple times, the same session URL
      // will be returned without creating duplicate charges.
      window.location.href = url;
    } catch (err) {
      checkoutInProgressRef.current = false;
      // Parse specific error messages from the backend
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('out_of_stock') || message.includes('409')) {
        setCheckoutError(t("cart.out_of_stock_error") || "Some items are no longer available");
      } else if (message.includes('503')) {
        setCheckoutError(t("cart.service_unavailable") || "Payment service temporarily unavailable");
      } else {
        setCheckoutError(t("cart.checkout_error"));
      }
      setCheckoutLoading(false);
    }
  }

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
  }, [isHydrated, items.length === 0]);

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

        {!isHydrated ? (
          <CartLoadingSkeleton />
        ) : items.length === 0 ? (
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
                const image = it.image || sizeImage(product, it.sizeId);
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
                {checkoutError && (
                  <p className="cart__error">{checkoutError}</p>
                )}
                <button
                  type="button"
                  className="cart__checkout"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? t("cart.checkout_loading") : t("cart.checkout")}
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

function CartLoadingSkeleton() {
  return (
    <div className="cart__loading" aria-hidden="true">
      <div className="cart__loading-list">
        {[1, 2, 3].map((row) => (
          <div className="cart__loading-row" key={row}>
            <span className="cart__loading-media" />
            <span className="cart__loading-copy">
              <span className="cart__loading-line cart__loading-line--name" />
              <span className="cart__loading-line cart__loading-line--detail" />
              <span className="cart__loading-line cart__loading-line--action" />
            </span>
            <span className="cart__loading-stepper" />
            <span className="cart__loading-price" />
          </div>
        ))}
      </div>
      <aside className="cart__loading-summary">
        <span className="cart__loading-line cart__loading-line--summary-label" />
        <span className="cart__loading-line cart__loading-line--summary-total" />
        <span className="cart__loading-line cart__loading-line--summary-note" />
        <span className="cart__loading-button" />
      </aside>
    </div>
  );
}
