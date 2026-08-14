"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "../LocaleContext/LocaleContext";
import JournalAdmin from "./JournalAdmin";
import ContentView from "./ContentView";
import { MediaGrid } from "./MediaLibrary";
import {
  api,
  downloadFile,
  downloadPath,
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

type View = "orders" | "customers" | "shop" | "journal" | "content" | "audit";

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
          {(["orders", "customers", "shop", "journal", "content", "audit"] as View[]).map((v) => (
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
        {view === "content" && <ContentView />}
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
            href={downloadPath(`/api/admin/orders/${order.id}/invoice`)}
            onClick={(e) => {
              e.preventDefault();
              downloadFile(`/api/admin/orders/${order.id}/invoice`).catch(() => {
                window.location.href = downloadPath(`/api/admin/orders/${order.id}/invoice`);
              });
            }}
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
        <a
          className="ad__export"
          href={downloadPath("/api/admin/customers.csv")}
          onClick={(e) => {
            e.preventDefault();
            downloadFile("/api/admin/customers.csv").catch(() => {
              window.location.href = downloadPath("/api/admin/customers.csv");
            });
          }}
        >
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
                <th>{t("admin.col_marketing")}</th>
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
                  <td>{c.marketingConsentAt ? "✓" : "·"}</td>
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

/* ── Shop management (products / prices / stock / images / featured) ── */

const EMPTY_PRODUCT = {
  name: "",
  subtitle: "",
  description: "",
  category: "",
  images: [] as string[],
  sizes: [{ id: "default", label: "", price: 0, stock: 0 }],
  defaultSizeId: "default" as string | null,
  packs: [] as { qty: number; discount: number }[],
  active: true,
  featured: false,
};

function ShopView() {
  const { t } = useLocale();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = () =>
    api<{ products: AdminProduct[] }>("/api/admin/products")
      .then((d) => setProducts(d.products))
      .catch(() => setFailed(true));

  useEffect(() => { void load(); }, []);

  const onCreated = (p: AdminProduct) => {
    setProducts((cur) => [p, ...(cur ?? [])]);
    setCreating(false);
    setOpen(p.id);
  };

  const onSaved = (upd: AdminProduct) =>
    setProducts((cur) => cur?.map((x) => (x.id === upd.id ? upd : x)) ?? null);

  const onDeleted = (id: string) =>
    setProducts((cur) => cur?.filter((x) => x.id !== id) ?? null);

  return (
    <div className="ad__view">
      <p className="ad__note">{t("admin.shop_note")}</p>
      <div className="ad__view-bar">
        <p className="ad__quiet">
          {products ? `${products.length} ${t("admin.products_count")}` : ""}
        </p>
        <button
          type="button"
          className="ad__add"
          onClick={() => setCreating((c) => !c)}
        >
          + {t("admin.new_product")}
        </button>
      </div>

      {creating && (
        <ProductEditor
          isNew
          onDone={(saved, p) => { if (saved && p) onCreated(p); else setCreating(false); }}
        />
      )}

      {products === null && !failed && <p className="ad__quiet">{t("portal.loading")}</p>}
      {failed && <p className="ad__quiet">{t("portal.error_load")}</p>}

      <ul className="ad__list">
        {(products ?? []).map((p) => (
          <li key={p.id} className={`ad__order${open === p.id ? " is--open" : ""}`}>
            <button
              type="button"
              className="ad__order-row"
              aria-expanded={open === p.id}
              onClick={() => setOpen((o) => (o === p.id ? null : p.id))}
            >
              {p.images[0] ? (
                <span className="ad__exhibit-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]} alt="" style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                </span>
              ) : (
                <span className="ad__exhibit-thumb ad__exhibit-thumb--empty" aria-hidden="true">·</span>
              )}
              <span className="ad__order-number">{p.name}</span>
              <span className="ad__order-date">{p.category || "·"}</span>
              <span className={`ad__status ad__status--${p.active ? "delivered" : "placed"}`}>
                {p.active ? t("admin.active") : t("admin.inactive")}
              </span>
              {p.featured && (
                <span className="ad__status ad__status--confirmed">{t("admin.featured")}</span>
              )}
            </button>
            {open === p.id && (
              <ProductEditor
                product={p}
                onDone={(saved, upd) => {
                  if (saved && upd) onSaved(upd);
                  else if (saved && !upd) { onDeleted(p.id); setOpen(null); }
                  else setOpen(null);
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductEditor({
  product,
  isNew,
  onDone,
}: {
  product?: AdminProduct;
  isNew?: boolean;
  onDone: (saved: boolean, updated?: AdminProduct) => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState<typeof EMPTY_PRODUCT & { id?: string; slug?: string }>(
    product
      ? {
          name: product.name,
          subtitle: product.subtitle,
          description: product.description ?? "",
          category: product.category ?? "",
          images: product.images ?? [],
          sizes: product.sizes,
          defaultSizeId: product.defaultSizeId ?? null,
          packs: product.packs,
          active: product.active,
          featured: product.featured,
          id: product.id,
          slug: product.slug,
        }
      : { ...EMPTY_PRODUCT }
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  // ── Size helpers ──────────────────────────────────────────────────
  const setSize = (i: number, key: "label" | "price" | "stock", val: string) =>
    setDraft((d) => ({
      ...d,
      sizes: d.sizes.map((s, j) =>
        j === i ? { ...s, [key]: key === "label" ? val : Number(val) || 0 } : s
      ),
    }));
  const addSize = () =>
    setDraft((d) => ({
      ...d,
      sizes: [...d.sizes, { id: `size-${Date.now()}`, label: "", price: 0, stock: 0 }],
    }));
  const removeSize = (i: number) =>
    setDraft((d) => ({ ...d, sizes: d.sizes.filter((_, j) => j !== i) }));

  // ── Pack helpers ──────────────────────────────────────────────────
  const setPack = (i: number, key: "qty" | "discount", val: string) =>
    setDraft((d) => ({
      ...d,
      packs: d.packs.map((p, j) =>
        j === i
          ? { ...p, [key]: key === "qty" ? Math.max(1, Number(val) || 1) : (Number(val) || 0) / 100 }
          : p
      ),
    }));
  const addPack = () =>
    setDraft((d) => ({ ...d, packs: [...d.packs, { qty: d.packs.length + 1, discount: 0 }] }));
  const removePack = (i: number) =>
    setDraft((d) => ({ ...d, packs: d.packs.filter((_, j) => j !== i) }));

  // ── Image helpers ─────────────────────────────────────────────────
  const addImage = (url: string) => {
    if (draft.images.includes(url)) return;
    setDraft((d) => ({ ...d, images: [...d.images, url] }));
    setImagePickerOpen(false);
  };
  const removeImage = (url: string) =>
    setDraft((d) => ({ ...d, images: d.images.filter((u) => u !== url) }));
  const moveImage = (from: number, to: number) => {
    setDraft((d) => {
      const imgs = [...d.images];
      const [item] = imgs.splice(from, 1);
      imgs.splice(to, 0, item);
      return { ...d, images: imgs };
    });
  };

  // ── Save ──────────────────────────────────────────────────────────
  const save = async () => {
    if (state === "saving" || !draft.name.trim() || !draft.sizes.length) return;
    setState("saving");
    try {
      const payload = {
        name: draft.name,
        subtitle: draft.subtitle,
        description: draft.description,
        category: draft.category,
        images: draft.images,
        active: draft.active,
        featured: draft.featured,
        sizes: draft.sizes,
        packs: draft.packs,
        defaultSizeId: draft.defaultSizeId,
      };
      let result: AdminProduct;
      if (isNew) {
        const d = await api<{ product: AdminProduct }>("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        result = d.product;
      } else {
        const d = await api<{ product: AdminProduct }>(`/api/admin/products/${draft.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        result = d.product;
      }
      setState("saved");
      setTimeout(() => setState("idle"), 2800);
      onDone(true, result);
    } catch {
      setState("error");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────
  const remove = async () => {
    if (!product || state === "saving") return;
    if (!window.confirm(t("admin.delete_confirm"))) return;
    setState("saving");
    try {
      await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
      onDone(true);
    } catch {
      setState("error");
    }
  };

  const uid = product?.id ?? "new";

  return (
    <div className="ad__order-detail ad__editor">
      {/* Basic info */}
      <div className="ad__track-fields">
        <div className="ad__field is--grow">
          <label htmlFor={`ad-name-${uid}`}>{t("admin.product_name")}</label>
          <input
            id={`ad-name-${uid}`}
            type="text"
            value={draft.name}
            maxLength={120}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <div className="ad__field is--grow">
          <label htmlFor={`ad-cat-${uid}`}>{t("admin.product_category")}</label>
          <input
            id={`ad-cat-${uid}`}
            type="text"
            value={draft.category}
            maxLength={60}
            placeholder="e.g. Olive Oil"
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          />
        </div>
      </div>
      <div className="ad__field is--grow">
        <label htmlFor={`ad-sub-${uid}`}>{t("admin.product_subtitle")}</label>
        <input
          id={`ad-sub-${uid}`}
          type="text"
          value={draft.subtitle}
          maxLength={160}
          onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
        />
      </div>
      <div className="ad__field is--grow">
        <label htmlFor={`ad-desc-${uid}`}>{t("admin.product_description")}</label>
        <textarea
          id={`ad-desc-${uid}`}
          rows={3}
          value={draft.description}
          maxLength={2000}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        />
      </div>

      {/* Toggles: active + featured */}
      <div className="ad__track-fields">
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
        <label className="ad__switch">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
          />
          <span className="ad__switch-track" aria-hidden="true" />
          <span className="ad__switch-label">
            {draft.featured ? t("admin.featured") : t("admin.not_featured")}
          </span>
        </label>
      </div>

      {/* Images */}
      <h3 className="ad__mini-title">{t("admin.product_images")}</h3>
      <div className="ad__img-strip">
        {draft.images.map((url, i) => (
          <div key={url} className="ad__img-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" />
            {i > 0 && (
              <button type="button" className="ad__img-move" title="Move left" onClick={() => moveImage(i, i - 1)}>‹</button>
            )}
            {i < draft.images.length - 1 && (
              <button type="button" className="ad__img-move ad__img-move--right" title="Move right" onClick={() => moveImage(i, i + 1)}>›</button>
            )}
            <button type="button" className="ad__img-remove" onClick={() => removeImage(url)} aria-label="Remove image">×</button>
          </div>
        ))}
      </div>
      <div className="ad__imagepick">
        <button
          type="button"
          className="ad__imagepick-toggle"
          aria-expanded={imagePickerOpen}
          onClick={() => setImagePickerOpen((o) => !o)}
        >
          {draft.images[0] ? (
            <span className="ad__imagepick-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.images[0]} alt="" />
            </span>
          ) : (
            <span className="ad__imagepick-none">{t("admin.no_image")}</span>
          )}
          <span>{t("admin.choose_image")}</span>
        </button>
        {imagePickerOpen && (
          <MediaGrid
            selected={draft.images}
            onPick={(url) =>
              draft.images.includes(url) ? removeImage(url) : addImage(url)
            }
            labels={{
              upload: t("admin.upload_image"),
              uploading: t("account.working"),
              failed: t("account.error_generic"),
              none: t("admin.no_image"),
            }}
          />
        )}
      </div>

      {/* Sizes, prices and stock */}
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
            <input aria-label={t("admin.size_label")} type="text" value={s.label}
              onChange={(e) => setSize(i, "label", e.target.value)} />
            <input aria-label={t("admin.size_price")} type="number" min={0} step="0.5" value={s.price}
              onChange={(e) => setSize(i, "price", e.target.value)} />
            <input aria-label={t("admin.size_stock")} type="number" min={0} value={s.stock}
              onChange={(e) => setSize(i, "stock", e.target.value)} />
            <input aria-label={t("admin.size_default")} type="radio"
              name={`ad-default-${uid}`}
              checked={draft.defaultSizeId === s.id}
              onChange={() => setDraft((d) => ({ ...d, defaultSizeId: s.id }))} />
            <button type="button" className="ad__row-x" aria-label={t("admin.remove")} onClick={() => removeSize(i)}>×</button>
          </div>
        ))}
      </div>
      <button type="button" className="ad__add" onClick={addSize}>+ {t("admin.add_size")}</button>

      {/* Pack discounts */}
      <h3 className="ad__mini-title">{t("admin.packs_title")}</h3>
      <div className="ad__rows is--packs">
        <div className="ad__row is--head">
          <span>{t("admin.pack_qty")}</span>
          <span>{t("admin.pack_discount")}</span>
          <span />
        </div>
        {draft.packs.map((p, i) => (
          <div className="ad__row" key={i}>
            <input aria-label={t("admin.pack_qty")} type="number" min={1} value={p.qty}
              onChange={(e) => setPack(i, "qty", e.target.value)} />
            <input aria-label={t("admin.pack_discount")} type="number" min={0} max={90}
              value={Math.round(p.discount * 100)}
              onChange={(e) => setPack(i, "discount", e.target.value)} />
            <button type="button" className="ad__row-x" aria-label={t("admin.remove")} onClick={() => removePack(i)}>×</button>
          </div>
        ))}
      </div>
      <button type="button" className="ad__add" onClick={addPack}>+ {t("admin.add_pack")}</button>

      {/* Save / delete */}
      <div className="ad__save-row">
        <button type="button" className="ad__save is--primary"
          disabled={state === "saving" || !draft.name.trim()}
          onClick={() => void save()}>
          <span>{state === "saving" ? t("account.working") : isNew ? t("admin.create_product") : t("portal.save")}</span>
          <span className="ad__save-line" aria-hidden="true" />
        </button>
        {!isNew && (
          <button type="button" className="ad__chip is--danger"
            disabled={state === "saving"}
            onClick={() => void remove()}>
            {t("admin.delete")}
          </button>
        )}
        <button type="button" className="ad__chip" onClick={() => onDone(false)}>
          {t("admin.cancel")}
        </button>
        {state === "saved" && <p className="ad__saved" role="status">{t("portal.saved")}</p>}
        {state === "error" && <p className="ad__saved is--error" role="alert">{t("account.error_generic")}</p>}
      </div>
    </div>
  );
}
