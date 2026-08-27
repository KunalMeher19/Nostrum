"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/Cart/CartContext";
import { useLocale } from "@/components/LocaleContext/LocaleContext";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import { api, startCheckout, type CheckoutShippingAddress, type Profile } from "@/lib/api";
import {
  formatEuro,
  getProduct,
  lineTotal,
} from "@/lib/products";
import "./checkout-review.css";

export default function CheckoutReviewPage() {
  const { items, subtotal, isHydrated } = useCart();
  const { t, locale } = useLocale();
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Address form state
  const [address, setAddress] = useState<CheckoutShippingAddress>({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    region: "",
    country: "ES",
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (isHydrated && items.length === 0) {
      router.push(`/${locale}/cart`);
    }
  }, [isHydrated, items.length, router, locale]);

  // Fetch user session and profile (with saved address)
  useEffect(() => {
    async function fetchUser() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.user) {
            setUser(sessionData.user);

            // Fetch full profile to get saved shipping address
            try {
              const profile = await api<Profile>("/api/me");

              // Pre-fill email, name, and saved shipping address
              setAddress((prev) => ({
                ...prev,
                email: sessionData.user.email || prev.email,
                fullName: profile.shipping?.fullName || sessionData.user.name || prev.fullName,
                phone: profile.shipping?.phone || prev.phone,
                line1: profile.shipping?.line1 || prev.line1,
                line2: profile.shipping?.line2 || prev.line2,
                city: profile.shipping?.city || prev.city,
                region: profile.shipping?.region || prev.region,
                postalCode: profile.shipping?.postalCode || prev.postalCode,
                country: profile.shipping?.country || prev.country,
              }));
            } catch (profileErr) {
              console.error("Failed to fetch user profile:", profileErr);
              // Still pre-fill email and name from session
              setAddress((prev) => ({
                ...prev,
                email: sessionData.user.email || prev.email,
                fullName: sessionData.user.name || prev.fullName,
              }));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user session:", err);
      } finally {
        setUserLoading(false);
      }
    }
    fetchUser();
  }, []);

  // Light theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-t", "1");
    root.style.setProperty("--nav-col", "rgb(20, 22, 15)");
    return () => {
      root.style.setProperty("--page-t", "0");
      root.style.setProperty("--nav-col", "rgb(245, 245, 243)");
    };
  }, []);

  const shippingCost = 0; // Free shipping for now
  const total = subtotal + shippingCost;

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    if (!address.fullName || !address.email || !address.line1 || !address.city || !address.postalCode || !address.country) {
      setCheckoutError(t("checkout.validation_error") || "Please fill in all required fields");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const payload = items.map((it) => ({
        slug: it.slug,
        sizeId: it.sizeId,
        qty: it.qty,
      }));

      // Pass the shipping address to the checkout API
      const { url } = await startCheckout(payload, locale, address);

      // Store address in sessionStorage to show on success page
      sessionStorage.setItem("checkoutAddress", JSON.stringify(address));

      // Redirect to Stripe
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("out_of_stock") || message.includes("409")) {
        setCheckoutError(t("cart.out_of_stock_error") || "Some items are no longer available");
      } else if (message.includes("503")) {
        setCheckoutError(t("cart.service_unavailable") || "Payment service temporarily unavailable");
      } else {
        setCheckoutError(t("cart.checkout_error") || "An error occurred");
      }
      setCheckoutLoading(false);
    }
  }

  function updateField(field: keyof CheckoutShippingAddress, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  if (!isHydrated || items.length === 0) {
    return null; // Redirecting or loading
  }

  return (
    <main data-main className="checkout-review" ref={rootRef}>
      <div className="checkout-review__inner">
        <header className="checkout-review__head">
          <p className="checkout-review__eyebrow">{t("checkout.eyebrow") || "Checkout"}</p>
          <h1 className="checkout-review__title">{t("checkout.title") || "Review & Confirm"}</h1>
        </header>

        <form className="checkout-review__layout" onSubmit={handleProceedToPayment}>
          {/* Left column: Address form */}
          <div className="checkout-review__main">
            {/* User status */}
            {!userLoading && (
              <div className="checkout-review__user-status">
                {user ? (
                  <p className="checkout-review__user-welcome">
                    {t("checkout.logged_in_as") || "Logged in as"} <strong>{user.email}</strong>
                  </p>
                ) : (
                  <p className="checkout-review__user-guest">
                    {t("checkout.guest_checkout") || "Guest checkout"} ·{" "}
                    <LocaleLink href="/auth/signin">{t("checkout.sign_in") || "Sign in"}</LocaleLink>
                  </p>
                )}
              </div>
            )}

            {/* Shipping address */}
            <section className="checkout-review__section">
              <h2 className="checkout-review__section-title">{t("checkout.shipping_address") || "Shipping address"}</h2>

              <div className="checkout-review__form-grid">
                <div className="checkout-review__form-group checkout-review__form-group--full">
                  <label htmlFor="fullName">
                    {t("checkout.full_name") || "Full name"} <span>*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={address.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    required
                  />
                </div>

                <div className="checkout-review__form-group">
                  <label htmlFor="email">
                    {t("checkout.email") || "Email"} <span>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={address.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>

                <div className="checkout-review__form-group">
                  <label htmlFor="phone">{t("checkout.phone") || "Phone"}</label>
                  <input
                    type="tel"
                    id="phone"
                    value={address.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>

                <div className="checkout-review__form-group checkout-review__form-group--full">
                  <label htmlFor="line1">
                    {t("checkout.address_line1") || "Address line 1"} <span>*</span>
                  </label>
                  <input
                    type="text"
                    id="line1"
                    value={address.line1}
                    onChange={(e) => updateField("line1", e.target.value)}
                    required
                  />
                </div>

                <div className="checkout-review__form-group checkout-review__form-group--full">
                  <label htmlFor="line2">{t("checkout.address_line2") || "Address line 2"}</label>
                  <input
                    type="text"
                    id="line2"
                    value={address.line2}
                    onChange={(e) => updateField("line2", e.target.value)}
                  />
                </div>

                <div className="checkout-review__form-group">
                  <label htmlFor="city">
                    {t("checkout.city") || "City"} <span>*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={address.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    required
                  />
                </div>

                <div className="checkout-review__form-group">
                  <label htmlFor="postalCode">
                    {t("checkout.postal_code") || "Postal code"} <span>*</span>
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    value={address.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    required
                  />
                </div>

                <div className="checkout-review__form-group">
                  <label htmlFor="region">{t("checkout.region") || "State/Region"}</label>
                  <input
                    type="text"
                    id="region"
                    value={address.region}
                    onChange={(e) => updateField("region", e.target.value)}
                  />
                </div>

                <div className="checkout-review__form-group">
                  <label htmlFor="country">
                    {t("checkout.country") || "Country"} <span>*</span>
                  </label>
                  <select
                    id="country"
                    value={address.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    required
                  >
                    <option value="ES">Spain</option>
                    <option value="FR">France</option>
                    <option value="DE">Germany</option>
                    <option value="IT">Italy</option>
                    <option value="PT">Portugal</option>
                    <option value="GB">United Kingdom</option>
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="AT">Austria</option>
                    <option value="CH">Switzerland</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Right column: Order summary (sticky) */}
          <aside className="checkout-review__summary">
            <div className="checkout-review__summary-panel">
              <h2 className="checkout-review__summary-title">{t("checkout.order_summary") || "Order summary"}</h2>

              <ul className="checkout-review__items">
                {items.map((it) => {
                  const product = getProduct(it.slug);
                  if (!product) return null;
                  const itemTotal = lineTotal(product, it.sizeId, it.qty);
                  return (
                    <li key={it.key} className="checkout-review__item">
                      <span className="checkout-review__item-name">
                        {it.name} · {it.sizeLabel}
                      </span>
                      <span className="checkout-review__item-qty">×{it.qty}</span>
                      <span className="checkout-review__item-price">{formatEuro(itemTotal)}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="checkout-review__totals">
                <div className="checkout-review__total-line">
                  <span>{t("checkout.subtotal") || "Subtotal"}</span>
                  <span>{formatEuro(subtotal)}</span>
                </div>
                <div className="checkout-review__total-line">
                  <span>{t("checkout.shipping") || "Shipping"}</span>
                  <span>{shippingCost === 0 ? t("checkout.free") || "Free" : formatEuro(shippingCost)}</span>
                </div>
                <div className="checkout-review__total-line checkout-review__total-line--final">
                  <span>{t("checkout.total") || "Total"}</span>
                  <span>{formatEuro(total)}</span>
                </div>
              </div>

              {checkoutError && (
                <p className="checkout-review__error">{checkoutError}</p>
              )}

              <button
                type="submit"
                className="checkout-review__btn-primary"
                disabled={checkoutLoading}
              >
                {checkoutLoading
                  ? (t("checkout.processing") || "Processing...")
                  : (t("checkout.proceed_to_payment") || "Proceed to payment")}
              </button>

              <LocaleLink href="/cart" className="checkout-review__btn-back">
                {t("checkout.back_to_cart") || "Back to cart"}
              </LocaleLink>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
