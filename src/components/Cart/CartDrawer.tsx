"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import "./cart-drawer.css";
import { useCart } from "./CartContext";
import { useLocale } from "../LocaleContext/LocaleContext";
import { LocaleLink } from "../LocaleContext/LocaleLink";
import { getLenis } from "../SmoothScroll/lenisStore";
import {
  COLLECTION_TILES,
  formatEuro,
  getProduct,
  lineTotal,
  tierFor,
  tilePrice,
} from "@/lib/products";

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

            {/* The collection trio, small — something to reach for */}
            <div className="cart-drawer__suggest">
              <p className="cart-drawer__suggest-eyebrow">
                {t("cart.suggest_eyebrow")}
              </p>
              <ul className="cart-drawer__suggest-list">
                {COLLECTION_TILES.map((tile) => {
                  const price = tilePrice(tile.id);
                  return (
                    <li key={tile.id}>
                      <LocaleLink
                        href={`/product/${tile.id}`}
                        className="cart-drawer__suggest-card"
                      >
                        <span
                          className="cart-drawer__suggest-media"
                          aria-hidden="true"
                        >
                          N
                        </span>
                        <span className="cart-drawer__suggest-meta">
                          <span className="cart-drawer__suggest-name">
                            {t(tile.nameKey)}
                          </span>
                          <span className="cart-drawer__suggest-detail">
                            {t(tile.detailKey)}
                          </span>
                        </span>
                        {price !== null && (
                          <span className="cart-drawer__suggest-price">
                            {formatEuro(price)}
                          </span>
                        )}
                      </LocaleLink>
                    </li>
                  );
                })}
              </ul>
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
                return (
                  <li key={it.key} className="cart-drawer__row">
                    <div className="cart-drawer__row-media" aria-hidden="true">
                      N
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
