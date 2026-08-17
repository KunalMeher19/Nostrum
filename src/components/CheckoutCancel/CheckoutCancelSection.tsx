"use client";

import { useLocale } from "@/components/LocaleContext/LocaleContext";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import "../CheckoutSuccess/checkout-result.css";

/* ------------------------------------------------------------------ */
/* Checkout Cancel — user clicked Back in the Stripe checkout UI.     */
/* Cart is preserved (items are still there), they can try again.     */
/* ------------------------------------------------------------------ */

export default function CheckoutCancelSection() {
  const { t } = useLocale();

  return (
    <section className="checkout-result">
      <div className="checkout-result__inner">
        <div className="checkout-result__icon checkout-result__icon--cancel">
          ×
        </div>
        <h1 className="checkout-result__title">
          {t("checkout_cancel.title")}
        </h1>
        <p className="checkout-result__message">
          {t("checkout_cancel.message")}
        </p>
        <div className="checkout-result__actions">
          <LocaleLink href="/cart" className="checkout-result__btn-primary">
            {t("checkout_cancel.return_to_cart")}
          </LocaleLink>
          <LocaleLink href="/products" className="checkout-result__btn-secondary">
            {t("checkout_cancel.continue_shopping")}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}
