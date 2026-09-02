// Backend URL — used server-side (Next.js pages/actions call Railway directly;
// the cookie is forwarded by the proxy route for browser-side calls).
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// Browser-side API client. Routes through /api/proxy/... so the session
// cookie (vercel.app domain) stays on the same origin and never needs to
// travel cross-domain to Railway. The proxy route forwards it server-side.
// In local dev, NEXT_PUBLIC_API_URL is localhost:5000 (same machine, no
// cross-domain problem), so we call it directly.
const IS_BROWSER = typeof window !== "undefined";
const IS_PROD = process.env.NODE_ENV === "production";

function proxyPath(path: string): string {
  // path looks like "/api/admin/orders" — strip the /api/ prefix
  // so the proxy route receives it as [...path] = ["admin","orders"].
  if (IS_BROWSER && IS_PROD) {
    return path.replace(/^\/api\//, "/api/proxy/");
  }
  return `${API_URL}${path}`;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = proxyPath(path);
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`api_${res.status}`);
  return res.json() as Promise<T>;
}

/* Downloads (CSV export, invoice PDF) fire as a top-level anchor
   navigation, not a fetch(). A direct <a href> to the backend can never
   carry the session cookie across domains, so these always go through
   the same-origin proxy regardless of environment. The proxy forwards
   the cookie server-side and passes Content-Disposition back. */
export function downloadPath(path: string): string {
  return path.replace(/^\/api\//, "/api/proxy/");
}

/* In-page download: fetch through the proxy, then click a hidden
   object-URL anchor. Avoids top-level navigation entirely, so the
   browser never shows its redirect/loading state while the proxy is
   talking to the backend. */
export async function downloadFile(path: string): Promise<void> {
  const res = await fetch(downloadPath(path), { credentials: "include" });
  if (!res.ok) throw new Error(`api_${res.status}`);
  const disposition = res.headers.get("content-disposition") ?? "";
  const name =
    disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
    path.split("/").pop() ??
    "download";
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Shapes served by the backend orders layer (see backend
   src/services/orders.service.js — the storefront swap point). */
export type OrderSummary = {
  id: string;
  number: string;
  status: OrderStatus;
  total: number;
  currency: string;
  placedAt: string;
  itemsCount: number;
  itemsSummary: string;
  active?: boolean;
  email?: string;
};

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  productSlug: string;
  productName: string;
  sizeId: string;
  sizeLabel: string;
  unitPrice: number;
  qty: number;
  discount: number;
  lineTotal: number;
};

export type ShippingAddress = {
  fullName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

export type OrderDetail = OrderSummary & {
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  statusHistory: { status: OrderStatus; at: string }[];
  shippingAddress: ShippingAddress | null;
  carrier: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  updatedAt: string;
};

export type Profile = {
  id: string;
  name: string | null;
  email: string;
  role: "customer" | "admin";
  locale: string | null;
  shipping: ShippingAddress | null;
  gdprConsentAt: string | null;
  marketingConsentAt: string | null;
  createdAt: string | null;
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
  gdprConsentAt: string | null;
  marketingConsentAt: string | null;
  createdAt: string | null;
  orderCount: number;
  orderTotal: number;
  shipping: {
    fullName: string;
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
  };
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category: string;
  images: string[];
  sizes: { id: string; label: string; price: number; stock: number }[];
  defaultSizeId: string | null;
  packs: { qty: number; discount: number }[];
  active: boolean;
  featured: boolean;
};

/* ── Journal (blog + digital museum) ─────────────────────────────── */

export type JournalPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: string | null;
  body?: string;
  // Translations for other locales (2026-08-20)
  translations?: {
    es?: { title: string; excerpt: string; body: string; slug: string } | null;
    ca?: { title: string; excerpt: string; body: string; slug: string } | null;
    it?: { title: string; excerpt: string; body: string; slug: string } | null;
    el?: { title: string; excerpt: string; body: string; slug: string } | null;
  };
};

export type MuseumExhibit = {
  id: string;
  title: string;
  caption: string;
  image: string;
  room: MuseumRoom;
  order: number;
};

export type MuseumRoom = "grove" | "harvest" | "mill" | "family";
export const MUSEUM_ROOMS: MuseumRoom[] = ["grove", "harvest", "mill", "family"];

export type AdminPost = JournalPost & {
  body: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type AdminExhibit = MuseumExhibit & {
  published: boolean;
};

/* Placeholder imagery available to the journal author until the client
   sends real factory photographs (and a media pipeline exists). */
export const JOURNAL_IMAGES: string[] = [
  ...[1, 2, 3, 4, 5].map((n) => `/images/${n}.png`),
  ...[1, 2, 3].map((n) => `/images/origin_${n}.png`),
  ...Array.from({ length: 14 }, (_, i) => `/products/${i + 1}.webp`),
];

/* ── Site content (admin-editable sections) ──────────────────────── */

export type ProcessStepImage = { url: string; alt?: string };
export type ProcessImagesContent = { steps: ProcessStepImage[] };
export type SiteContentResponse<T> = { key: string; value: T | null };

/* European price formatting, same as the Shop. */
export function euro(value: number) {
  return "€" + value.toFixed(2).replace(".", ",");
}

/* ── Guest order tracking (no account) ───────────────────────────── */

/* POST keeps the email out of URLs/logs; the number + purchase-email
   pair is the ownership proof (same model as carrier tracking pages). */
export function lookupOrder(payload: { number: string; email: string }) {
  return api<{ order: OrderDetail }>("/api/orders/lookup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ── Admin audit trail (read-only) ───────────────────────────────── */

export type AuditEvent = {
  id: string;
  actorId: string;
  actorEmail: string | null;
  action: string;
  target: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  at: string;
};

/* ── Public writes: contact form + newsletter (GDPR) ─────────────── */

export type ContactTopic = "general" | "professional" | "press";

export function submitContact(payload: {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  locale?: string;
}) {
  return api<{ ok: true }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function subscribeNewsletter(payload: {
  email: string;
  consent: true;
  locale?: string;
}) {
  return api<{ ok: true }>("/api/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function unsubscribeNewsletter(token: string) {
  return api<{ ok: true }>("/api/newsletter/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/* ── Stripe checkout ──────────────────────────────────────────────── */

export type CheckoutItem = {
  slug: string;
  sizeId: string;
  qty: number;
};

/** Generate a unique idempotency key for checkout requests.
 *  Format: timestamp-random to ensure uniqueness across sessions. */
function generateIdempotencyKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}${random2}`;
}

/** Shipping address shape for checkout (required fields for payment) */
export type CheckoutShippingAddress = {
  fullName: string;
  email: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  region?: string;
  country: string;
};

/** POST /api/checkout — validate cart server-side, create a Stripe
 *  Checkout Session with pre-filled shipping address, and return the hosted checkout URL.
 *
 *  Includes automatic idempotency: generates a unique key that is stored
 *  in localStorage. If the user clicks checkout multiple times or the
 *  request is retried, the same key is sent so Stripe returns the existing
 *  session instead of creating duplicate charges. */
export function startCheckout(items: CheckoutItem[], locale: string, shippingAddress: CheckoutShippingAddress) {
  // Generate or retrieve idempotency key from localStorage
  const storageKey = 'nostrum_checkout_idempotency';
  let idempotencyKey: string;

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Reuse the key if it's less than 10 minutes old
        if (parsed.key && Date.now() - parsed.timestamp < 10 * 60 * 1000) {
          idempotencyKey = parsed.key;
        } else {
          idempotencyKey = generateIdempotencyKey();
          localStorage.setItem(storageKey, JSON.stringify({
            key: idempotencyKey,
            timestamp: Date.now(),
          }));
        }
      } catch {
        idempotencyKey = generateIdempotencyKey();
        localStorage.setItem(storageKey, JSON.stringify({
          key: idempotencyKey,
          timestamp: Date.now(),
        }));
      }
    } else {
      idempotencyKey = generateIdempotencyKey();
      localStorage.setItem(storageKey, JSON.stringify({
        key: idempotencyKey,
        timestamp: Date.now(),
      }));
    }
  } else {
    // Server-side: generate a new key (won't be cached)
    idempotencyKey = generateIdempotencyKey();
  }

  return api<{ url: string }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ items, locale, idempotencyKey, shippingAddress }),
  });
}

/** Clear the checkout idempotency key after successful payment.
 *  Call this from the success page to allow the user to make a new purchase. */
export function clearCheckoutIdempotency() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nostrum_checkout_idempotency');
  }
}
