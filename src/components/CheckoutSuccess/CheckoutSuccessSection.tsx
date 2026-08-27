"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleContext/LocaleContext";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import { useCart } from "@/components/Cart/CartContext";
import { clearCheckoutIdempotency, type OrderDetail } from "@/lib/api";
import { getProduct, sizeImage } from "@/lib/products";
import "./checkout-result.css";

/* ------------------------------------------------------------------ */
/* Checkout Success — payment confirmed, order created by the webhook. */
/* Polls the backend for the order (webhook fires asynchronously after */
/* Stripe redirects), then shows full order card with items, address,  */
/* delivery estimate, and confirmation notice.                         */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function fetchOrderBySession(sessionId: string): Promise<OrderDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/orders/by-session/${sessionId}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.order ?? null;
  } catch {
    return null;
  }
}

function formatEuro(value: number) {
  return "€" + value.toFixed(2).replace(".", ",");
}

// Calculate expected delivery date: placedAt + 3-5 working days
function deliveryWindow(placedAt: string, locale: string): string {
  const placed = new Date(placedAt);
  const earliest = addWorkingDays(placed, 3);
  const latest = addWorkingDays(placed, 5);
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { day: "numeric", month: "short" });
  return `${fmt(earliest)} – ${fmt(latest)}`;
}

function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++; // Skip weekends
  }
  return result;
}

export default function CheckoutSuccessSection() {
  const { t, locale } = useLocale();
  const { clear } = useCart();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollAttempts, setPollAttempts] = useState(0);

  useEffect(() => {
    // Clear the cart exactly once on mount (payment succeeded).
    clear();
    // Clear the idempotency key so the next checkout generates a fresh one.
    clearCheckoutIdempotency();
    const sid = searchParams.get("session_id");
    setSessionId(sid);

    if (!sid) {
      setLoading(false);
      return;
    }

    // Poll for the order: webhook fires asynchronously after Stripe redirects,
    // so there's a 1-5 second window where the order doesn't exist yet.
    // Retry up to 4 times with 2s intervals (max 8s total wait).
    let attempts = 0;
    const maxAttempts = 4;
    const pollInterval = 2000; // 2 seconds

    async function poll() {
      if (!sid) {
        setLoading(false);
        return;
      }
      attempts++;
      setPollAttempts(attempts);
      const fetched = await fetchOrderBySession(sid);
      if (fetched) {
        setOrder(fetched);
        setLoading(false);
        return;
      }
      if (attempts < maxAttempts) {
        setTimeout(poll, pollInterval);
      } else {
        // Give up after 4 attempts — show the fallback state
        setLoading(false);
      }
    }

    poll();
  }, [clear, searchParams]);

  // Show loading state while polling
  if (loading) {
    return (
      <section className="checkout-result">
        <div className="checkout-result__inner">
          <div className="checkout-result__loader">
            <svg className="checkout-result__spinner" viewBox="0 0 50 50">
              <circle
                className="checkout-result__spinner-path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="3"
              />
            </svg>
          </div>
          <h1 className="checkout-result__title">{t("checkout_success.loading_order")}</h1>
          <p className="checkout-result__message">{t("checkout_success.message")}</p>
        </div>
      </section>
    );
  }

  // Order not found after polling — webhook hasn't fired yet or failed
  if (!order) {
    return (
      <section className="checkout-result">
        <div className="checkout-result__inner">
          <h1 className="checkout-result__title">{t("checkout_success.title")}</h1>
          <p className="checkout-result__message">{t("checkout_success.order_not_ready")}</p>
          {sessionId && (
            <p className="checkout-result__detail">
              {t("checkout_success.session")}: <code>{sessionId}</code>
            </p>
          )}
          <div className="checkout-result__actions">
            <LocaleLink href="/account" className="checkout-result__btn-primary">
              {t("checkout_success.view_orders")}
            </LocaleLink>
            <LocaleLink href="/products" className="checkout-result__btn-secondary">
              {t("checkout_success.continue_shopping")}
            </LocaleLink>
          </div>
        </div>
      </section>
    );
  }

  // Order fetched — show the full order card in compact two-column layout
  const addr = order.shippingAddress;
  const delivery = deliveryWindow(order.placedAt, locale);

  return (
    <section className="checkout-result">
      <div className="checkout-result__inner checkout-result__inner--rich">
        <CheckoutSteps />
        <h1 className="checkout-result__title">{t("checkout_success.title")}</h1>
        <p className="checkout-result__message">{t("checkout_success.message")}</p>

        {/* Order number - prominent display */}
        <div className="checkout-result__order-number">
          <span className="checkout-result__label">{t("checkout_success.order_number")}</span>
          <span className="checkout-result__value">{order.number}</span>
        </div>

        {/* Two-column grid for compact layout */}
        <div className="checkout-result__grid">

          {/* Left column: Items + Totals */}
          <div className="checkout-result__section">
            <h2 className="checkout-result__section-title">{t("checkout_success.items_ordered")}</h2>
            <ul className="checkout-result__items">
              {order.items.map((item, i) => {
                const product = getProduct(item.productSlug || "extra-virgin-olive-oil");
                const image = product ? sizeImage(product, item.sizeId || "5l") : null;
                return (
                  <li key={i} className="checkout-result__item">
                    {image ? (
                      <img src={image} alt="" className="checkout-result__item-image" />
                    ) : (
                      <span className="checkout-result__item-image checkout-result__item-image--placeholder" aria-hidden="true" />
                    )}
                    <span className="checkout-result__item-name">
                      {item.productName} · {item.sizeLabel}
                      <span className="checkout-result__item-qty-inline">Quantity: {item.qty}</span>
                    </span>
                    <span className="checkout-result__item-price">{formatEuro(item.lineTotal)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="checkout-result__totals">
              <div className="checkout-result__total-line">
                <span>{t("checkout_success.subtotal")}</span>
                <span>{formatEuro(order.subtotal)}</span>
              </div>
              <div className="checkout-result__total-line">
                <span>{t("checkout_success.shipping")}</span>
                <span>
                  {order.shippingCost > 0
                    ? formatEuro(order.shippingCost)
                    : t("checkout_success.shipping_free")}
                </span>
              </div>
              <div className="checkout-result__total-line checkout-result__total-line--final">
                <span>{t("checkout_success.total_paid")}</span>
                <span>{formatEuro(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Right column: Delivery info + Address */}
          <div>
            {/* Expected delivery */}
            <div className="checkout-result__section">
              <h2 className="checkout-result__section-title">{t("checkout_success.delivery_estimate")}</h2>
              <p className="checkout-result__delivery">{delivery}</p>
              <p className="checkout-result__note">{t("checkout_success.delivery_window")}</p>
            </div>

            {/* Delivery address */}
            {addr && (
              <div className="checkout-result__section">
                <h2 className="checkout-result__section-title">{t("checkout_success.delivery_address")}</h2>
                <address className="checkout-result__address">
                  {addr.fullName && <div>{addr.fullName}</div>}
                  {addr.line1 && <div>{addr.line1}</div>}
                  {addr.line2 && <div>{addr.line2}</div>}
                  <div>
                    {[addr.postalCode, addr.city, addr.region].filter(Boolean).join(", ")}
                  </div>
                  {addr.country && <div>{addr.country}</div>}
                  {addr.phone && <div>{addr.phone}</div>}
                </address>
              </div>
            )}
          </div>
        </div>

        {/* Email confirmation notice */}
        <div className="checkout-result__notice">
          <p>
            {t("checkout_success.email_sent")} <strong>{order.email}</strong>
          </p>
        </div>

        {/* What happens next - compact numbered list */}
        <div className="checkout-result__section">
          <h2 className="checkout-result__section-title">{t("checkout_success.what_next")}</h2>
          <ol className="checkout-result__steps">
            <li>{t("checkout_success.next_1")}</li>
            <li>{t("checkout_success.next_2")}</li>
            <li>{t("checkout_success.next_3")}</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="checkout-result__actions">
          <LocaleLink href="/account" className="checkout-result__btn-primary">
            {t("checkout_success.view_orders")}
          </LocaleLink>
          <LocaleLink href="/products" className="checkout-result__btn-secondary">
            {t("checkout_success.continue_shopping")}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}

function CheckoutSteps() {
  return (
    <nav className="checkout-steps checkout-steps--result" aria-label="Checkout progress">
      <span className="checkout-steps__step is-complete">
        <span className="checkout-steps__dot">✓</span>
        <span>Cart</span>
      </span>
      <span className="checkout-steps__line is-complete" aria-hidden="true" />
      <span className="checkout-steps__step is-complete">
        <span className="checkout-steps__dot">✓</span>
        <span>Review &amp; confirm</span>
      </span>
      <span className="checkout-steps__line is-complete" aria-hidden="true" />
      <span className="checkout-steps__step is-complete">
        <span className="checkout-steps__dot">✓</span>
        <span>Payment</span>
      </span>
    </nav>
  );
}
