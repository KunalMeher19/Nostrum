"use client";

import { useState } from "react";
import { useLocale } from "../LocaleContext/LocaleContext";
import {
  euro,
  lookupOrder,
  type OrderDetail,
  type OrderStatus,
} from "@/lib/api";
import "./track-order.css";

/* ------------------------------------------------------------------ */
/* TrackOrderSection — /[locale]/track · guest order tracking.          */
/*                                                                      */
/* No account needed: the order number + purchase email pair is the     */
/* proof of ownership (POST /api/orders/lookup, rate-limited). Same     */
/* material language as the portal: olive gradient card on ink, gold    */
/* bloom, grain, hairlines; the shipping timeline is the gold moment.   */
/* ------------------------------------------------------------------ */

const FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

type Phase = "idle" | "working" | "notfound" | "error";

export default function TrackOrderSection() {
  const { t, locale } = useLocale();
  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase === "working") return;
    const form = new FormData(e.currentTarget);
    setPhase("working");
    try {
      const d = await lookupOrder({
        number: String(form.get("number") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
      });
      setOrder(d.order);
      setPhase("idle");
    } catch (err) {
      setOrder(null);
      setPhase(
        err instanceof Error && /api_(404|400)/.test(err.message)
          ? "notfound"
          : "error"
      );
    }
  };

  return (
    <section className="tk" aria-labelledby="tk-title">
      <div className="tk__card">
        <span className="tk__glow" aria-hidden="true" />
        <span className="tk__grain" aria-hidden="true" />

        <p className="tk__eyebrow">{t("track.eyebrow")}</p>

        {order === null ? (
          <>
            <h1 id="tk-title" className="tk__title">
              {t("track.title")}
            </h1>
            <p className="tk__lede">{t("track.lede")}</p>

            <form className="tk__form" onSubmit={onSubmit}>
              <div className="tk__field">
                <label htmlFor="tk-number">{t("track.field_number")}</label>
                <input
                  id="tk-number"
                  name="number"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="NST-2026-0001"
                  spellCheck={false}
                />
                <span className="tk__field-line" aria-hidden="true" />
              </div>
              <div className="tk__field">
                <label htmlFor="tk-email">{t("track.field_email")}</label>
                <input
                  id="tk-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
                <span className="tk__field-line" aria-hidden="true" />
              </div>

              <button
                type="submit"
                className="tk__cta"
                disabled={phase === "working"}
              >
                {phase === "working" ? t("track.working") : t("track.submit")}
              </button>

              {phase === "notfound" && (
                <p className="tk__note" role="alert">
                  {t("track.not_found")}
                </p>
              )}
              {phase === "error" && (
                <p className="tk__note" role="alert">
                  {t("track.error")}
                </p>
              )}
            </form>
          </>
        ) : (
          <OrderResult order={order} dateFmt={dateFmt} onReset={() => setOrder(null)} />
        )}
      </div>
    </section>
  );
}

/* ── Found: the order, told quietly ────────────────────────────────── */

function OrderResult({
  order,
  dateFmt,
  onReset,
}: {
  order: OrderDetail;
  dateFmt: (iso: string) => string;
  onReset: () => void;
}) {
  const { t } = useLocale();
  const stageIdx = FLOW.indexOf(order.status);

  return (
    <div className="tk__result">
      <h1 id="tk-title" className="tk__title is--number">
        {order.number}
      </h1>
      <p className="tk__lede">
        {t("track.placed_on")} {dateFmt(order.placedAt)}
        {" · "}
        <span className={`tk__state tk__state--${order.status}`}>
          {t(`portal.status_${order.status}`)}
        </span>
      </p>

      {order.status !== "cancelled" && (
        <ol className="tk__timeline" aria-label={t("portal.status")}>
          {FLOW.map((s, i) => (
            <li
              key={s}
              className={`tk__step${i <= stageIdx ? " is--done" : ""}${
                i === stageIdx ? " is--now" : ""
              }`}
            >
              <span className="tk__step-dot" aria-hidden="true" />
              <span className="tk__step-label">{t(`portal.status_${s}`)}</span>
              {order.statusHistory?.find((h) => h.status === s) && (
                <span className="tk__step-date">
                  {dateFmt(order.statusHistory.find((h) => h.status === s)!.at)}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {(order.carrier || order.shippingAddress?.line1) && (
        <div className="tk__ship">
          {order.carrier && (
            <p className="tk__ship-line">
              <span className="tk__mini-label">{t("portal.carrier")}</span>
              {order.carrier}
              {order.trackingCode && (
                <>
                  {" · "}
                  {order.trackingUrl ? (
                    <a
                      className="tk__tracking-link"
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {order.trackingCode}
                    </a>
                  ) : (
                    order.trackingCode
                  )}
                </>
              )}
            </p>
          )}
          {order.shippingAddress?.line1 && (
            <p className="tk__ship-line">
              <span className="tk__mini-label">{t("portal.ships_to")}</span>
              {[
                order.shippingAddress.fullName,
                order.shippingAddress.line1,
                order.shippingAddress.city,
                order.shippingAddress.country,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      <ul className="tk__items">
        {order.items.map((it, i) => (
          <li key={i}>
            <span>
              {it.productName} · {it.sizeLabel} ×{it.qty}
            </span>
            <span>{euro(it.lineTotal)}</span>
          </li>
        ))}
        <li className="tk__items-ship">
          <span>{t("portal.shipping_cost")}</span>
          <span>
            {order.shippingCost > 0
              ? euro(order.shippingCost)
              : t("portal.shipping_free")}
          </span>
        </li>
        <li className="tk__items-total">
          <span>{t("portal.total")}</span>
          <span>{euro(order.total)}</span>
        </li>
      </ul>

      <button type="button" className="tk__again" onClick={onReset}>
        {t("track.search_again")}
      </button>
    </div>
  );
}
