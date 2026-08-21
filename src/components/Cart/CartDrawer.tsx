"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import "./cart-drawer.css";
import { useCart } from "./CartContext";
import { useLocale } from "../LocaleContext/LocaleContext";
import { LocaleLink } from "../LocaleContext/LocaleLink";
import { getLenis } from "../SmoothScroll/lenisStore";
import {
  formatEuro,
  getProduct,
  lineTotal,
  sizeImage,
  tierFor,
} from "@/lib/products";

type SuggestedProduct = {
  slug: string;
  name: string;
  subtitle: string;
  images: string[];
  sizes: { id: string; label: string; price: number }[];
  defaultSizeId: string | null;
};

/* ------------------------------------------------------------------ */
/* CartDrawer — slide-in cart, same chrome language as the menu          */
/* takeover: the live page stays beneath, blurred behind a dark scrim,   */
/* while an ink panel slides in from the right with gold hairlines and   */
/* off-white text. Opens from the nav cart icon and automatically when   */
/* an item is added (see CartContext). CSS-transition driven — the       */
/* is--open class is the whole state machine; reduced-motion gets an     */
/* instant cut via media query. Ends in two CTAs: view the full cart     */
/* page, or checkout (quietly disabled until payments land, §1.1).       */
/* Empty cart = an invitation, not a dead end: editorial line + shop CTA */
/* + the collection trio as small suggestion tiles.                      */
/* ------------------------------------------------------------------ */

export default function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    setQty,
    removeItem,
    drawerOpen,
    closeDrawer,
  } = useCart();
  const { t } = useLocale();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/proxy/products")
      .then((response) => {
        if (!response.ok) throw new Error("Product API unavailable");
        return response.json() as Promise<{ products?: SuggestedProduct[] }>;
      })
      .then((data) => {
        if (!alive) return;
        setSuggestedProducts(data.products ?? []);
        setSuggestionsLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setSuggestionsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Close on any route change — "View full cart" / suggestion links
     navigate under the drawer; the new page must start unobstructed. */
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      closeDrawer();
    }
  }, [pathname, closeDrawer]);

  /* Scroll lock while open. Lenis is a shared singleton the hero also
     stops (loader/slideshow), so snapshot whether it was already stopped
     and only start() it again if WE stopped it — same contract as the
     menu takeover. */
  const lenisWasStopped = useRef(false);
  useEffect(() => {
    const lenis = getLenis();
    if (!lenis) return;
    if (drawerOpen) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lenisWasStopped.current = (lenis as any).isStopped === true;
      lenis.stop();
      return () => {
        if (!lenisWasStopped.current) lenis.start();
      };
    }
  }, [drawerOpen]);

  /* Esc closes; focus moves to the close button on open so keyboard
     users land inside the dialog. */
  useEffect(() => {
    if (!drawerOpen) return;
    closeBtnRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  return (
    <div
      className={`cart-drawer${drawerOpen ? " is--open" : ""}`}
      aria-hidden={!drawerOpen}
    >
      {/* Blurred live page + dark scrim — the whole area is a dismiss target */}
      <div className="cart-drawer__veil" onClick={closeDrawer} />

      <aside
        ref={panelRef}
        className="cart-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.drawer_title")}
        data-lenis-prevent
        // Keep the panel out of the tab order entirely while closed.
        {...(drawerOpen ? {} : { inert: true })}
      >
        {/* ---- Head ------------------------------------------------- */}
        <header className="cart-drawer__head">
          <div>
            <p className="cart-drawer__eyebrow">{t("cart.eyebrow")}</p>
            <p className="cart-drawer__title">
              {t("cart.drawer_title")}
              {count > 0 && (
                <span className="cart-drawer__count">
                  {count} {count === 1 ? t("cart.item") : t("cart.items")}
                </span>
              )}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="cart-drawer__close"
            onClick={closeDrawer}
            aria-label={t("cart.close")}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="cart-drawer__rule" aria-hidden="true" />

        {items.length === 0 ? (
          /* ---- Empty: an invitation into the Shop ------------------ */
          <div className="cart-drawer__body cart-drawer__body--empty">
            <div className="cart-drawer__empty">
              <p className="cart-drawer__empty-title">{t("cart.empty_title")}</p>
              <p className="cart-drawer__empty-note">{t("cart.empty_note")}</p>
              <LocaleLink href="/products" className="cart-drawer__cta">
                {t("cart.empty_cta")}
              </LocaleLink>
            </div>

            {/* Live catalog suggestions, small — something to reach for */}
            <div className="cart-drawer__suggest">
              <p className="cart-drawer__suggest-eyebrow">
                {t("cart.suggest_eyebrow")}
              </p>
              {suggestionsLoading || suggestedProducts.length === 0 ? (
                <ul className="cart-drawer__suggest-list cart-drawer__suggest-list--skeleton" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <li key={n}>
                      <div className="cart-drawer__suggest-skeleton">
                        <span className="cart-drawer__suggest-skeleton-media" />
                        <span className="cart-drawer__suggest-skeleton-copy">
                          <span className="cart-drawer__suggest-skeleton-line cart-drawer__suggest-skeleton-line--name" />
                          <span className="cart-drawer__suggest-skeleton-line cart-drawer__suggest-skeleton-line--detail" />
                        </span>
                        <span className="cart-drawer__suggest-skeleton-price" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="cart-drawer__suggest-list">
                  {suggestedProducts.map((product) => {
                    const size =
                      product.sizes.find((s) => s.id === product.defaultSizeId) ??
                      product.sizes[0];
                    const image = product.images[0];
                  return (
                    <li key={product.slug}>
                      <LocaleLink
                        href={`/product/${product.slug}`}
                        className="cart-drawer__suggest-card"
                      >
                        <span
                          className="cart-drawer__suggest-media"
                          aria-hidden="true"
                        >
                          {image ? <img src={image} alt="" /> : "N"}
                        </span>
                        <span className="cart-drawer__suggest-meta">
                          <span className="cart-drawer__suggest-name">
                            {product.name}
                          </span>
                          <span className="cart-drawer__suggest-detail">
                            {size?.label ?? product.subtitle}
                          </span>
                        </span>
                        {size && (
                          <span className="cart-drawer__suggest-price">
                            {formatEuro(size.price)}
                          </span>
                        )}
                      </LocaleLink>
                    </li>
                  );
                })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ---- Line items ------------------------------------- */}
            <ul className="cart-drawer__body cart-drawer__list">
              {items.map((it) => {
                const product = getProduct(it.slug);
                if (!product) return null;
                const total = lineTotal(product, it.sizeId, it.qty);
                const tier = tierFor(product, it.qty);
                const image = it.image || sizeImage(product, it.sizeId);
                return (
                  <li key={it.key} className="cart-drawer__row">
                    <div className="cart-drawer__row-media" aria-hidden="true">
                      {image ? <img src={image} alt="" /> : "N"}
                    </div>
                    <div className="cart-drawer__row-info">
                      <p className="cart-drawer__row-name">{it.name}</p>
                      <p className="cart-drawer__row-sub">
                        {it.subtitle} · {it.sizeLabel}
                        {tier.discount > 0 && (
                          <em> · −{Math.round(tier.discount * 100)}%</em>
                        )}
                      </p>
                      <div className="cart-drawer__row-foot">
                        <div
                          className="cart-drawer__qty"
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
                        <button
                          type="button"
                          className="cart-drawer__remove"
                          onClick={() => removeItem(it.key)}
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                    <p className="cart-drawer__row-price">{formatEuro(total)}</p>
                  </li>
                );
              })}
            </ul>

            {/* ---- Foot: subtotal + the two CTAs ------------------- */}
            <footer className="cart-drawer__foot">
              <div className="cart-drawer__rule" aria-hidden="true" />
              <div className="cart-drawer__subtotal">
                <span>{t("cart.subtotal")}</span>
                <span>{formatEuro(subtotal)}</span>
              </div>
              <p className="cart-drawer__note">{t("cart.shipping_note")}</p>
              <button type="button" className="cart-drawer__checkout" disabled>
                {t("cart.checkout")}
                <span>{t("cart.checkout_soon")}</span>
              </button>
              <LocaleLink href="/cart" className="cart-drawer__view">
                {t("cart.view_cart")}
              </LocaleLink>
              <button
                type="button"
                className="cart-drawer__continue"
                onClick={closeDrawer}
              >
                {t("cart.continue")}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
