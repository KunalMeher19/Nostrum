"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./cart.css";
import { useCart } from "@/components/Cart/CartContext";
import { formatEuro, getProduct, lineTotal, tierFor } from "@/lib/products";

/* ------------------------------------------------------------------ */
/* Cart — LIGHT/white (§7 flow: product → cart → checkout). Minimal     */
/* working cart: line items with unbounded quantity steppers, live pack  */
/* discounts, subtotal. Checkout itself lands later — the CTA says so    */
/* quietly instead of dead-ending.                                       */
/* ------------------------------------------------------------------ */

export default function CartPage() {
  const { items, subtotal, setQty, removeItem } = useCart();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-t", "1");
    root.style.setProperty("--nav-col", "rgb(20, 22, 15)");
    return () => {
      root.style.setProperty("--page-t", "0");
      root.style.setProperty("--nav-col", "rgb(245, 245, 243)");
    };
  }, []);

  return (
    <main data-main className="cart">
      <div className="cart__inner">
        <header className="cart__head">
          <h1 className="cart__title">Cart</h1>
          <p className="cart__eyebrow">Shop</p>
        </header>

        {items.length === 0 ? (
          <div className="cart__empty">
            <p>Your cart is empty.</p>
            <Link href="/#products" className="cart__back">
              ← Back to the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart__list">
              {items.map((it) => {
                const product = getProduct(it.slug);
                if (!product) return null;
                const total = lineTotal(product, it.sizeId, it.qty);
                const tier = tierFor(product, it.qty);
                return (
                  <li key={it.key} className="cart__row">
                    <div className="cart__row-media" aria-hidden="true">
                      N
                    </div>
                    <div className="cart__row-info">
                      <p className="cart__row-name">
                        {it.name} · {it.subtitle}
                      </p>
                      <p className="cart__row-size">
                        {it.sizeLabel}
                        {tier.discount > 0 && (
                          <em> · −{Math.round(tier.discount * 100)}%</em>
                        )}
                      </p>
                      <button
                        type="button"
                        className="cart__row-remove"
                        onClick={() => removeItem(it.key)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="cart__row-qty" aria-label="Quantity">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(it.key, it.qty - 1)}
                      >
                        −
                      </button>
                      <span>{it.qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
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

            <div className="cart__summary">
              <div className="cart__subtotal">
                <span>Subtotal</span>
                <span>{formatEuro(subtotal)}</span>
              </div>
              <p className="cart__note">Shipping calculated at checkout.</p>
              <button type="button" className="cart__checkout" disabled>
                Checkout — coming soon
              </button>
              <Link href="/#products" className="cart__back">
                ← Continue shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
