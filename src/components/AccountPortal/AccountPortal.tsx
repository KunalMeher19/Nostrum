"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useLocale } from "../LocaleContext/LocaleContext";
import {
  api,
  API_URL,
  euro,
  type OrderDetail,
  type OrderStatus,
  type OrderSummary,
  type Profile,
  type ShippingAddress,
} from "@/lib/api";
import "./account-portal.css";

/* ------------------------------------------------------------------ */
/* AccountPortal — the signed-in customer portal on /account (§8).      */
/*                                                                      */
/* Dark editorial, not a dashboard: one wide olive panel, poster        */
/* greeting, orders as quiet ledger rows, a slow gold timeline for      */
/* the order in motion. Order history · active orders with shipping     */
/* status · PDF invoices · editable shipping/account details · a CTA    */
/* back into the Shop. Explicitly NO wishlist.                          */
/* ------------------------------------------------------------------ */

const FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

type Tab = "orders" | "details";

export default function AccountPortal({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string | null;
  role: "customer" | "admin";
}) {
  const { t, locale } = useLocale();
  const first = (name ?? "").split(" ")[0] || t("account.friend");

  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [open, setOpen] = useState<string | null>(null); // expanded order id
  const [detail, setDetail] = useState<Record<string, OrderDetail>>({});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api<{ orders: OrderSummary[] }>("/api/orders")
      .then((d) => alive && setOrders(d.orders))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setOpen((cur) => (cur === id ? null : id));
      if (!detail[id]) {
        api<{ order: OrderDetail }>(`/api/orders/${id}`)
          .then((d) => setDetail((m) => ({ ...m, [id]: d.order })))
          .catch(() => undefined);
      }
    },
    [detail]
  );

  const active = orders?.filter((o) => o.active) ?? [];
  const history = orders?.filter((o) => !o.active) ?? [];

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <section className="pt" aria-labelledby="pt-title">
      <div className="pt__panel">
        <div className="pt__glow" aria-hidden="true" />
        <div className="pt__grain" aria-hidden="true" />

        <header className="pt__head">
          <p className="pt__eyebrow">{t("portal.eyebrow")}</p>
          <h1 id="pt-title" className="pt__headline">
            {t("account.welcome")} {first}.
          </h1>
          <p className="pt__lede">
            {email}
            {role === "admin" ? ` · ${t("account.role_admin")}` : ""}
          </p>
        </header>

        {orders !== null && orders.length > 0 && (
          <dl className="pt__stats">
            <div className="pt__stat">
              <dt>{t("portal.stat_orders")}</dt>
              <dd>{orders.length}</dd>
            </div>
            <div className="pt__stat">
              <dt>{t("portal.stat_active")}</dt>
              <dd>{active.length}</dd>
            </div>
            <div className="pt__stat">
              <dt>{t("portal.stat_spent")}</dt>
              <dd>
                {euro(
                  orders
                    .filter((o) => o.status !== "cancelled")
                    .reduce((sum, o) => sum + o.total, 0)
                )}
              </dd>
            </div>
          </dl>
        )}

        <nav className="pt__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "orders"}
            className={`pt__tab${tab === "orders" ? " is--on" : ""}`}
            onClick={() => setTab("orders")}
          >
            {t("portal.tab_orders")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "details"}
            className={`pt__tab${tab === "details" ? " is--on" : ""}`}
            onClick={() => setTab("details")}
          >
            {t("portal.tab_details")}
          </button>
        </nav>

        {tab === "orders" && (
          <div className="pt__orders">
            {orders === null && !failed && (
              <p className="pt__quiet">{t("portal.loading")}</p>
            )}
            {failed && <p className="pt__quiet">{t("portal.error_load")}</p>}

            {orders !== null && orders.length === 0 && (
              <div className="pt__empty">
                <p className="pt__empty-line">{t("portal.empty_title")}</p>
                <p className="pt__quiet">{t("portal.empty_lede")}</p>
              </div>
            )}

            {active.length > 0 && (
              <>
                <h2 className="pt__section-title">{t("portal.active_title")}</h2>
                <ul className="pt__list">
                  {active.map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      open={open === o.id}
                      detail={detail[o.id]}
                      onToggle={toggle}
                      dateFmt={dateFmt}
                    />
                  ))}
                </ul>
              </>
            )}

            {history.length > 0 && (
              <>
                <h2 className="pt__section-title">{t("portal.history_title")}</h2>
                <ul className="pt__list">
                  {history.map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      open={open === o.id}
                      detail={detail[o.id]}
                      onToggle={toggle}
                      dateFmt={dateFmt}
                    />
                  ))}
                </ul>
              </>
            )}

            <Link className="pt__cta" href={`/${locale}/products`}>
              <span>{t("portal.buy_more")}</span>
              <span className="pt__cta-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        )}

        {tab === "details" && <DetailsForm />}

        <footer className="pt__foot">
          {role === "admin" && (
            <Link className="pt__foot-link" href={`/${locale}/admin`}>
              {t("account.go_admin")}
            </Link>
          )}
          <button
            type="button"
            className="pt__foot-link"
            onClick={() => void signOut({ callbackUrl: `/${locale}` })}
          >
            {t("account.signout")}
          </button>
        </footer>
      </div>
    </section>
  );
}

/* ── One order: ledger row + expandable detail ─────────────────────── */

function OrderRow({
  order,
  open,
  detail,
  onToggle,
  dateFmt,
}: {
  order: OrderSummary;
  open: boolean;
  detail?: OrderDetail;
  onToggle: (id: string) => void;
  dateFmt: (iso: string) => string;
}) {
  const { t } = useLocale();
  const stageIdx = FLOW.indexOf(order.status);

  return (
    <li className={`pt__order${open ? " is--open" : ""}`}>
      <button
        type="button"
        className="pt__order-row"
        aria-expanded={open}
        onClick={() => onToggle(order.id)}
      >
        <span className="pt__order-number">{order.number}</span>
        <span className="pt__order-date">{dateFmt(order.placedAt)}</span>
        <span className="pt__order-items">{order.itemsSummary}</span>
        <span className="pt__order-total">{euro(order.total)}</span>
        <span
          className={`pt__status pt__status--${order.status}`}
        >
          {t(`portal.status_${order.status}`)}
        </span>
        <span className="pt__order-chev" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="pt__order-detail">
          {order.status !== "cancelled" && (
            <ol className="pt__timeline" aria-label={t("portal.status")}>
              {FLOW.map((s, i) => (
                <li
                  key={s}
                  className={`pt__step${i <= stageIdx ? " is--done" : ""}${
                    i === stageIdx ? " is--now" : ""
                  }`}
                >
                  <span className="pt__step-dot" aria-hidden="true" />
                  <span className="pt__step-label">
                    {t(`portal.status_${s}`)}
                  </span>
                  {detail?.statusHistory?.find((h) => h.status === s) && (
                    <span className="pt__step-date">
                      {dateFmt(
                        detail.statusHistory.find((h) => h.status === s)!.at
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}

          {detail ? (
            <div className="pt__detail-grid">
              <div>
                <h3 className="pt__detail-title">{t("portal.items")}</h3>
                <ul className="pt__items">
                  {detail.items.map((it, i) => (
                    <li key={i}>
                      <span>
                        {it.productName} · {it.sizeLabel} ×{it.qty}
                      </span>
                      <span>{euro(it.lineTotal)}</span>
                    </li>
                  ))}
                  <li className="pt__items-ship">
                    <span>{t("portal.shipping_cost")}</span>
                    <span>
                      {detail.shippingCost > 0
                        ? euro(detail.shippingCost)
                        : t("portal.shipping_free")}
                    </span>
                  </li>
                  <li className="pt__items-total">
                    <span>{t("portal.total")}</span>
                    <span>{euro(detail.total)}</span>
                  </li>
                </ul>
              </div>

              <div>
                {detail.carrier && (
                  <p className="pt__ship-line">
                    <span className="pt__mini-label">{t("portal.carrier")}</span>
                    {detail.carrier}
                    {detail.trackingCode && (
                      <>
                        {" · "}
                        {detail.trackingUrl ? (
                          <a
                            className="pt__tracking-link"
                            href={detail.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {detail.trackingCode}
                          </a>
                        ) : (
                          detail.trackingCode
                        )}
                      </>
                    )}
                  </p>
                )}
                {detail.shippingAddress?.line1 && (
                  <p className="pt__ship-line">
                    <span className="pt__mini-label">
                      {t("portal.ships_to")}
                    </span>
                    {[
                      detail.shippingAddress.fullName,
                      detail.shippingAddress.line1,
                      detail.shippingAddress.city,
                      detail.shippingAddress.country,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <a
                  className="pt__invoice"
                  href={`${API_URL}/api/orders/${order.id}/invoice`}
                >
                  {t("portal.invoice")}
                  <span aria-hidden="true"> ↓</span>
                </a>
              </div>
            </div>
          ) : (
            <p className="pt__quiet">{t("portal.loading")}</p>
          )}
        </div>
      )}
    </li>
  );
}

/* ── Details: account + shipping (PATCH /api/me) ───────────────────── */

const SHIP_FIELDS: (keyof ShippingAddress)[] = [
  "fullName",
  "line1",
  "line2",
  "city",
  "region",
  "postalCode",
  "country",
  "phone",
];

function DetailsForm() {
  const { t } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  useEffect(() => {
    let alive = true;
    api<Profile>("/api/me")
      .then((p) => alive && setProfile(p))
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === "saving") return;
    setState("saving");
    const form = new FormData(e.currentTarget);
    const shipping: ShippingAddress = {};
    for (const f of SHIP_FIELDS) shipping[f] = String(form.get(f) ?? "");
    try {
      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ name: String(form.get("name") ?? ""), shipping }),
      });
      setState("saved");
      window.setTimeout(() => setState("idle"), 2800);
    } catch {
      setState("error");
    }
  };

  if (!profile && state !== "error") {
    return <p className="pt__quiet">{t("portal.loading")}</p>;
  }
  if (!profile) return <p className="pt__quiet">{t("portal.error_load")}</p>;

  const s = profile.shipping ?? {};

  return (
    <form className="pt__details" onSubmit={onSubmit}>
      <h2 className="pt__section-title">{t("portal.details_title")}</h2>

      <div className="pt__fields">
        <Field name="name" label={t("account.field_name")} def={profile.name ?? ""} />
        <div className="pt__field is--static">
          <label>{t("account.field_email")}</label>
          <p>{profile.email}</p>
        </div>
      </div>

      <h2 className="pt__section-title">{t("portal.shipping_title")}</h2>
      <div className="pt__fields">
        <Field name="fullName" label={t("portal.field_fullname")} def={s.fullName ?? ""} />
        <Field name="phone" label={t("portal.field_phone")} def={s.phone ?? ""} />
        <Field name="line1" label={t("portal.field_line1")} def={s.line1 ?? ""} wide />
        <Field name="line2" label={t("portal.field_line2")} def={s.line2 ?? ""} wide />
        <Field name="city" label={t("portal.field_city")} def={s.city ?? ""} />
        <Field name="region" label={t("portal.field_region")} def={s.region ?? ""} />
        <Field name="postalCode" label={t("portal.field_postal")} def={s.postalCode ?? ""} />
        <Field name="country" label={t("portal.field_country")} def={s.country ?? ""} />
      </div>

      <div className="pt__save-row">
        <button type="submit" className="pt__save" disabled={state === "saving"}>
          <span>
            {state === "saving" ? t("account.working") : t("portal.save")}
          </span>
          <span className="pt__save-line" aria-hidden="true" />
        </button>
        {state === "saved" && (
          <p className="pt__saved" role="status">
            {t("portal.saved")}
          </p>
        )}
        {state === "error" && (
          <p className="pt__saved is--error" role="alert">
            {t("account.error_generic")}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  def,
  wide,
}: {
  name: string;
  label: string;
  def: string;
  wide?: boolean;
}) {
  return (
    <div className={`pt__field${wide ? " is--wide" : ""}`}>
      <label htmlFor={`pt-${name}`}>{label}</label>
      <input id={`pt-${name}`} name={name} type="text" defaultValue={def} />
      <span className="pt__field-line" aria-hidden="true" />
    </div>
  );
}
