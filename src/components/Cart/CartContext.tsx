"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getProduct, lineTotal } from "@/lib/products";

/* ------------------------------------------------------------------ */
/* Cart — client-side working cart (§7 flow: product → cart → checkout). */
/*                                                                     */
/* Items merge by product+size; quantities are unbounded (never limit  */
/* the client). Pack discounts are NOT baked into stored prices — line */
/* totals are recomputed from the catalog on render, so a price change */
/* never leaves stale totals in someone's saved cart. Persisted to     */
/* localStorage so the cart survives reloads until checkout exists.    */
/* ------------------------------------------------------------------ */

export type CartItem = {
  key: string; // `${slug}:${sizeId}`
  slug: string;
  name: string;
  subtitle: string;
  sizeId: string;
  sizeLabel: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  /* Total units in the cart — the nav badge number. */
  count: number;
  subtotal: number;
  addItem: (
    item: Omit<CartItem, "key" | "qty">,
    qty: number
  ) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "nostrum:cart:v1";

function loadStored(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is CartItem =>
        it &&
        typeof it.key === "string" &&
        typeof it.slug === "string" &&
        typeof it.sizeId === "string" &&
        typeof it.qty === "number" &&
        it.qty > 0 &&
        // Drop items whose product no longer exists in the catalog.
        !!getProduct(it.slug)
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);

  // Hydrate from localStorage after mount (SSR renders an empty cart, so the
  // server and first client paint always match — no hydration mismatch).
  useEffect(() => {
    setItems(loadStored());
    hydrated.current = true;
  }, []);

  // Persist on every change (skip the pre-hydration empty state so a fast
  // remount can't wipe a saved cart).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / private mode — cart still works in-memory */
    }
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "key" | "qty">, qty: number) => {
      if (qty < 1) return;
      const key = `${item.slug}:${item.sizeId}`;
      setItems((prev) => {
        const existing = prev.find((it) => it.key === key);
        if (existing) {
          return prev.map((it) =>
            it.key === key ? { ...it, qty: it.qty + qty } : it
          );
        }
        return [...prev, { ...item, key, qty }];
      });
    },
    []
  );

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty < 1
        ? prev.filter((it) => it.key !== key)
        : prev.map((it) => (it.key === key ? { ...it, qty } : it))
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, it) => sum + it.qty, 0);
    const subtotal = items.reduce((sum, it) => {
      const product = getProduct(it.slug);
      return product ? sum + lineTotal(product, it.sizeId, it.qty) : sum;
    }, 0);
    return { items, count, subtotal, addItem, setQty, removeItem, clear };
  }, [items, addItem, setQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
