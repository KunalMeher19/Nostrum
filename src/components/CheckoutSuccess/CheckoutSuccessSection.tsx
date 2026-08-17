"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleContext/LocaleContext";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import { useCart } from "@/components/Cart/CartContext";
import "./checkout-result.css";

/* ------------------------------------------------------------------ */
/* Checkout Success — payment confirmed, order created by the webhook. */
/* Clear the cart, show a confirmation message with the session ID     */
/* (the order number comes later via email once the webhook fires).    */
/* ------------------------------------------------------------------ */

export default function CheckoutSuccessSection() {
  const { t } = useLocale();
  const { clear } = useCart();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Clear the cart exactly once on mount (payment succeeded).
    clear();
    const sid = searchParams.get("session_id");
    setSessionId(sid);
  }, [clear, searchParams]);

  return (
    <section className="checkout-result">
      <div className="checkout-result__inner">
        <div className="checkout-result__icon checkout-result__icon--success">
          ✓
        </div>
        <h1 className="checkout-result__title">
          {t("checkout_success.title")}
        </h1>
        <p className="checkout-result__message">
          {t("checkout_success.message")}
        </p>
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
