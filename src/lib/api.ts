// Tiny client for the Express API (port 5000). The session cookie is
// shared (same AUTH_SECRET), so credentials: "include" is all we need.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`api_${res.status}`);
  return res.json() as Promise<T>;
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
  createdAt: string | null;
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
  gdprConsentAt: string | null;
  createdAt: string | null;
  orderCount: number;
  orderTotal: number;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  sizes: { id: string; label: string; price: number; stock: number }[];
  defaultSizeId: string | null;
  packs: { qty: number; discount: number }[];
  active: boolean;
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

/* European price formatting, same as the Shop. */
export function euro(value: number) {
  return "€" + value.toFixed(2).replace(".", ",");
}

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
