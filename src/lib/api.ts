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

/* European price formatting, same as the Shop. */
export function euro(value: number) {
  return "€" + value.toFixed(2).replace(".", ",");
}
