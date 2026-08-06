"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "../LocaleContext/LocaleContext";
import JournalAdmin from "./JournalAdmin";
import {
  api,
  API_URL,
  euro,
  type AdminCustomer,
  type AdminProduct,
  type AuditEvent,
  type OrderDetail,
  type OrderStatus,
  type OrderSummary,
} from "@/lib/api";
import "./admin-portal.css";

/* ------------------------------------------------------------------ */
/* AdminPortal — /[locale]/admin (role-gated in the page).              */
/*                                                                      */
/* The house's back room: same dark material as the portal, one wide    */
/* panel, three quiet ledgers. Orders (list · detail · status update,   */
/* which reflects straight into the customer portal), Customers (CSV    */
/* export for email marketing: name, email, consent date, orders),      */
/* Shop (edit the MongoDB mirror of the catalog: prices, stock, sizes,  */
/* packs). The public Shop keeps its placeholder data until the client  */
/* confirms the real catalogue.                                         */
/* ------------------------------------------------------------------ */

const STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

type View = "orders" | "customers" | "shop" | "journal" | "audit";

export default function AdminPortal({ name }: { name: string | null }) {
  const { t, locale } = useLocale();
  const [view, setView] = useState<View>("orders");

  return (
    <section className="ad" aria-labelledby="ad-title">
      <div className="ad__panel">
        <div className="ad__glow" aria-hidden="true" />
        <div className="ad__grain" aria-hidden="true" />

        <header className="ad__head">
          <p className="ad__eyebrow">{t("admin.eyebrow")}</p>
          <h1 id="ad-title" className="ad__headline">
            {t("admin.headline")}
          </h1>
          <p className="ad__lede">
            {name ? `${name} · ` : ""}
            {t("admin.lede")}
          </p>
        </header>

        <nav className="ad__tabs" role="tablist">
          {(["orders", "customers", "shop", "journal", "audit"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={`ad__tab${view === v ? " is--on" : ""}`}
              onClick={() => setView(v)}
            >
              {t(`admin.tab_${v}`)}
            </button>
          ))}
        </nav>

        {view === "orders" && <OrdersView />}
        {view === "customers" && <CustomersView />}
        {view === "shop" && <ShopView />}
        {view === "journal" && <JournalAdmin />}
        {view === "audit" && <AuditView />}

        <footer className="ad__foot">
          <Link className="ad__foot-link" href={`/${locale}/account`}>
            {t("admin.back_account")}
          </Link>
        </footer>
      </div>
    </section>
  );
}

/* ── Orders ─────────────────────────────────────────────────────────── */

function OrdersView() {
  const { t, locale } = useLocale();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, OrderDetail>>({});
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    const qs = filter === "all" ? "" : `?status=${filter}`;
    api<{ orders: OrderSummary[] }>(`/api/admin/orders${qs}`)
      .then((d) => setOrders(d.orders))
      .catch(() => setFailed(true));
  }, [filter]);

  useEffect(load, [load]);

  const openOrder = (id: string) => {
    setOpen((cur) => (cur === id ? null : id));
    api<{ order: OrderDetail }>(`/api/admin/orders/${id}`)
      .then((d) => setDetail((m) => ({ ...m, [id]: d.order })))
      .catch(() => undefined);
  };

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="ad__view">
      <div className="ad__filters" role="group" aria-label={t("admin.filter")}>
        <button
          type="button"
          className={`ad__chip${filter === "all" ? " is--on" : ""}`}
          onClick={() => setFilter("all")}
        >
          {t("admin.filter_all")}
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`ad__chip${filter === s ? " is--on" : ""}`}
            onClick={() => setFilter(s)}
          >
            {t(`portal.status_${s}`)}
          </button>
        ))}
      </div>

      {orders === null && !failed && <p className="ad__quiet">{t("portal.loading")}</p>}
      {failed && <p className="ad__quiet">{t("portal.error_load")}</p>}
      {orders !== null && orders.length === 0 && (
        <p className="ad__quiet">{t("admin.orders_none")}</p>
      )}

      <ul className="ad__list">
        {(orders ?? []).map((o) => (
          <li key={o.id} className={`ad__order${open === o.id ? " is--open" : ""}`}>
            <button
              type="button"
              className="ad__order-row"
              aria-expanded={open === o.id}
              onClick={() => openOrder(o.id)}
            >
              <span className="ad__order-number">{o.number}</span>
              <span className="ad__order-email">{o.email}</span>
              <span className="ad__order-date">{dateFmt(o.placedAt)}</span>
              <span className="ad__order-total">{euro(o.total)}</span>
              <span className={`ad__status ad__status--${o.status}`}>
                {t(`portal.status_${o.status}`)}
              </span>
            </button>
            {open === o.id && (
              <OrderDetailPanel
                order={detail[o.id]}
                onUpdated={(upd) => {
                  setDetail((m) => ({ ...m, [o.id]: upd }));
                  setOrders(
                    (cur) =>
                      cur?.map((x) =>
                        x.id === o.id ? { ...x, status: upd.status } : x
                      ) ?? null
                  );
                }}
                dateFmt={dateFmt}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderDetailPanel({
  order,
  onUpdated,
  dateFmt,
}: {
  order?: OrderDetail;
  onUpdated: (o: OrderDetail) => void;
  dateFmt: (iso: string) => string;
}) {
  const { t } = useLocale();
  const [saving, setSaving] = useState(false);
  const [carrier, setCarrier] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);

  if (!order) return <p className="ad__quiet">{t("portal.loading")}</p>;

  const setStatus = async (status: OrderStatus) => {
    if (saving || status === order.status) return;
    setSaving(true);
    try {
      const d = await api<{ order: OrderDetail }>(
        `/api/admin/orders/${order.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            carrier: carrier ?? order.carrier ?? undefined,
            trackingCode: tracking ?? order.trackingCode ?? undefined,
          }),
        }
      );
      onUpdated(d.order);
    } catch {
      /* status chip simply stays put */
    } finally {
      setSaving(false);
    }
  };

  const a = order.shippingAddress;

  return (
    <div className="ad__order-detail">
      <div className="ad__detail-cols">
        <div>
          <h3 className="ad__mini-title">{t("portal.items")}</h3>
          <ul className="ad__items">
            {order.items.map((it, i) => (
              <li key={i}>
                <span>
                  {it.productName} · {it.sizeLabel} ×{it.qty}
                </span>
                <span>{euro(it.lineTotal)}</span>
              </li>
            ))}
            <li className="ad__items-total">
              <span>{t("portal.total")}</span>
              <span>{euro(order.total)}</span>
            </li>
          </ul>

          {a?.line1 && (
            <>
              <h3 className="ad__mini-title">{t("portal.ships_to")}</h3>
              <p className="ad__addr">
                {[a.fullName, a.line1, a.line2, `${a.postalCode ?? ""} ${a.city ?? ""}`, a.region, a.country, a.phone]
                  .filter((x) => x && String(x).trim())
                  .join(" · ")}
              </p>
            </>
          )}

          <a
            className="ad__invoice"
            href={`${API_URL}/api/admin/orders/${order.id}/invoice`}
          >
            {t("portal.invoice")}
            <span aria-hidden="true"> ↓</span>
          </a>
        </div>

        <div>
          <h3 className="ad__mini-title">{t("admin.update_status")}</h3>
          <div className="ad__status-set" role="group">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={saving}
                className={`ad__chip${order.status === s ? " is--on" : ""}`}
                onClick={() => void setStatus(s)}
              >
                {t(`portal.status_${s}`)}
              </button>
            ))}
          </div>

          <div className="ad__track-fields">
            <div className="ad__field">
              <label htmlFor={`ad-carrier-${order.id}`}>{t("portal.carrier")}</label>
              <input
                id={`ad-carrier-${order.id}`}
                type="text"
                defaultValue={order.carrier ?? ""}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>
            <div className="ad__field">
              <label htmlFor={`ad-track-${order.id}`}>{t("admin.tracking")}</label>
              <input
                id={`ad-track-${order.id}`}
                type="text"
                defaultValue={order.trackingCode ?? ""}
                onChange={(e) => setTracking(e.target.value)}
              />
            </div>
          </div>

          <h3 className="ad__mini-title">{t("admin.timeline")}</h3>
          <ul className="ad__history">
            {order.statusHistory.map((h, i) => (
              <li key={i}>
                <span>{t(`portal.status_${h.status}`)}</span>
                <span>{dateFmt(h.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Customers (CSV export for email marketing) ────────────────────── */

function CustomersView() {
  const { t, locale } = useLocale();
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<{ customers: AdminCustomer[] }>("/api/admin/customers")
      .then((d) => setCustomers(d.customers))
      .catch(() => setFailed(true));
  }, []);

  const dateFmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "·";

  return (
    <div className="ad__view">
      <div className="ad__view-bar">
        <p className="ad__quiet">
          {customers ? `${customers.length} ${t("admin.customers_count")}` : ""}
        </p>
        <a className="ad__export" href={`${API_URL}/api/admin/customers.csv`}>
          {t("admin.export_csv")}
          <span aria-hidden="true"> ↓</span>
        </a>
      </div>

      {customers === null && !failed && (
        <p className="ad__quiet">{t("portal.loading")}</p>
      )}
      {failed && <p className="ad__quiet">{t("portal.error_load")}</p>}

      {customers && (
        <div className="ad__table-wrap">
          <table className="ad__table">
            <thead>
              <tr>
                <th>{t("account.field_name")}</th>
                <th>{t("account.field_email")}</th>
                <th>{t("admin.col_consent")}</th>
                <th>{t("admin.col_joined")}</th>
                <th className="is--num">{t("admin.col_orders")}</th>
                <th className="is--num">{t("admin.col_total")}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.name || "·"}
                    {c.role === "admin" ? (
                      <span className="ad__role-tag">{t("account.role_admin")}</span>
                    ) : null}
                  </td>
                  <td>{c.email}</td>
                  <td>{dateFmt(c.gdprConsentAt)}</td>
                  <td>{dateFmt(c.createdAt)}</td>
                  <td className="is--num">{c.orderCount}</td>
                  <td className="is--num">{euro(c.orderTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Audit trail (read-only, append-only on the backend) ───────────── */

function AuditView() {
  const { t, locale } = useLocale();
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<{ events: AuditEvent[] }>("/api/admin/audit-events")
      .then((d) => setEvents(d.events))
      .catch(() => setFailed(true));
  }, []);

  const whenFmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="ad__view">
      <p className="ad__note">{t("admin.audit_note")}</p>

      {events === null && !failed && (
        <p className="ad__quiet">{t("portal.loading")}</p>
      )}
      {failed && <p className="ad__quiet">{t("portal.error_load")}</p>}
      {events !== null && events.length === 0 && (
        <p className="ad__quiet">{t("admin.audit_none")}</p>
      )}

      {events !== null && events.length > 0 && (
        <div className="ad__table-wrap">
          <table className="ad__table">
            <thead>
              <tr>
                <th>{t("admin.col_when")}</th>
                <th>{t("admin.col_actor")}</th>
                <th>{t("admin.col_action")}</th>
                <th>{t("admin.col_target")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="ad__audit-when">{whenFmt(e.at)}</td>
                  <td>{e.actorEmail ?? e.actorId}</td>
                  <td>
                    <span className="ad__audit-action">{e.action}</span>
                    {e.meta && (
                      <span className="ad__audit-meta">
                        {Object.entries(e.meta)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" · ")}
                      </span>
                    )}
                  </td>
                  <td>{e.target ?? "·"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Shop management (products / prices / stock / sizes / packs) ───── */

function ShopView() {
  const { t } = useLocale();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<{ products: AdminProduct[] }>("/api/admin/products")
      .then((d) => setProducts(d.products))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="ad__view">
      <p className="ad__note">{t("admin.shop_note")}</p>
      {products === null && !failed && (
        <p className="ad__quiet">{t("portal.loading")}</p>
      )}
      {failed && <p className="ad__quiet">{t("portal.error_load")}</p>}
      {products?.map((p) => (
        <ProductEditor
          key={p.id}
          product={p}
          onSaved={(upd) =>
            setProducts((cur) => cur?.map((x) => (x.id === upd.id ? upd : x)) ?? null)
          }
        />
      ))}
    </div>
  );
}

function ProductEditor({
  product,
  onSaved,
}: {
  product: AdminProduct;
  onSaved: (p: AdminProduct) => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState<AdminProduct>(product);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const setSize = (i: number, key: "label" | "price" | "stock", value: string) => {
    setDraft((d) => ({
      ...d,
      sizes: d.sizes.map((s, j) =>
        j === i
          ? { ...s, [key]: key === "label" ? value : Number(value) || 0 }
          : s
      ),
    }));
  };

  const addSize = () =>
    setDraft((d) => ({
      ...d,
      sizes: [...d.sizes, { id: `size-${Date.now()}`, label: "", price: 0, stock: 0 }],
    }));

  const removeSize = (i: number) =>
    setDraft((d) => ({ ...d, sizes: d.sizes.filter((_, j) => j !== i) }));

  const setPack = (i: number, key: "qty" | "discount", value: string) => {
    setDraft((d) => ({
      ...d,
      packs: d.packs.map((p, j) =>
        j === i
          ? {
              ...p,
              [key]: key === "qty" ? Math.max(1, Number(value) || 1) : (Number(value) || 0) / 100,
            }
          : p
      ),
    }));
  };

  const addPack = () =>
    setDraft((d) => ({ ...d, packs: [...d.packs, { qty: d.packs.length + 1, discount: 0 }] }));

  const removePack = (i: number) =>
    setDraft((d) => ({ ...d, packs: d.packs.filter((_, j) => j !== i) }));

  const save = async () => {
    if (state === "saving") return;
    setState("saving");
    try {
      const d = await api<{ product: AdminProduct }>(
        `/api/admin/products/${draft.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: draft.name,
            subtitle: draft.subtitle,
            active: draft.active,
            sizes: draft.sizes,
            packs: draft.packs,
            defaultSizeId: draft.defaultSizeId ?? undefined,
          }),
        }
      );
      onSaved(d.product);
      setDraft(d.product);
      setState("saved");
      window.setTimeout(() => setState("idle"), 2800);
    } catch {
      setState("error");
    }
  };

  return (
    <article className="ad__product">
      <header className="ad__product-head">
        <div className="ad__field is--grow">
          <label htmlFor={`ad-name-${draft.id}`}>{t("admin.product_name")}</label>
          <input
            id={`ad-name-${draft.id}`}
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <div className="ad__field is--grow">
          <label htmlFor={`ad-sub-${draft.id}`}>{t("admin.product_subtitle")}</label>
          <input
            id={`ad-sub-${draft.id}`}
            type="text"
            value={draft.subtitle}
            onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
          />
        </div>
        <label className="ad__switch">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
          />
          <span className="ad__switch-track" aria-hidden="true" />
          <span className="ad__switch-label">
            {draft.active ? t("admin.active") : t("admin.inactive")}
          </span>
        </label>
      </header>

      <h3 className="ad__mini-title">{t("admin.sizes_title")}</h3>
      <div className="ad__rows">
        <div className="ad__row is--head">
          <span>{t("admin.size_label")}</span>
          <span>{t("admin.size_price")}</span>
          <span>{t("admin.size_stock")}</span>
          <span>{t("admin.size_default")}</span>
          <span />
        </div>
        {draft.sizes.map((s, i) => (
          <div className="ad__row" key={i}>
            <input
              aria-label={t("admin.size_label")}
              type="text"
              value={s.label}
              onChange={(e) => setSize(i, "label", e.target.value)}
            />
            <input
              aria-label={t("admin.size_price")}
              type="number"
              min={0}
              step="0.5"
              value={s.price}
              onChange={(e) => setSize(i, "price", e.target.value)}
            />
            <input
              aria-label={t("admin.size_stock")}
              type="number"
              min={0}
              value={s.stock}
              onChange={(e) => setSize(i, "stock", e.target.value)}
            />
            <input
              aria-label={t("admin.size_default")}
              type="radio"
              name={`ad-default-${draft.id}`}
              checked={draft.defaultSizeId === s.id}
              onChange={() => setDraft((d) => ({ ...d, defaultSizeId: s.id }))}
            />
            <button
              type="button"
              className="ad__row-x"
              aria-label={t("admin.remove")}
              onClick={() => removeSize(i)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="ad__add" onClick={addSize}>
        + {t("admin.add_size")}
      </button>

      <h3 className="ad__mini-title">{t("admin.packs_title")}</h3>
      <div className="ad__rows is--packs">
        <div className="ad__row is--head">
          <span>{t("admin.pack_qty")}</span>
          <span>{t("admin.pack_discount")}</span>
          <span />
        </div>
        {draft.packs.map((p, i) => (
          <div className="ad__row" key={i}>
            <input
              aria-label={t("admin.pack_qty")}
              type="number"
              min={1}
              value={p.qty}
              onChange={(e) => setPack(i, "qty", e.target.value)}
            />
            <input
              aria-label={t("admin.pack_discount")}
              type="number"
              min={0}
              max={90}
              value={Math.round(p.discount * 100)}
              onChange={(e) => setPack(i, "discount", e.target.value)}
            />
            <button
              type="button"
              className="ad__row-x"
              aria-label={t("admin.remove")}
              onClick={() => removePack(i)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="ad__add" onClick={addPack}>
        + {t("admin.add_pack")}
      </button>

      <div className="ad__save-row">
        <button
          type="button"
          className="ad__save"
          disabled={state === "saving"}
          onClick={() => void save()}
        >
          <span>{state === "saving" ? t("account.working") : t("portal.save")}</span>
          <span className="ad__save-line" aria-hidden="true" />
        </button>
        {state === "saved" && (
          <p className="ad__saved" role="status">
            {t("portal.saved")}
          </p>
        )}
        {state === "error" && (
          <p className="ad__saved is--error" role="alert">
            {t("account.error_generic")}
          </p>
        )}
      </div>
    </article>
  );
}
