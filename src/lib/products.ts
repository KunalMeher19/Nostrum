/* ------------------------------------------------------------------ */
/* Product catalog — §7 (Shop).                                        */
/*                                                                     */
/* One flexible catalog: products carry their own sizes, pack tiers    */
/* and copy, so new product types (honey — maybe later) drop in        */
/* without touching the page. The home "Collection" tiles (single /    */
/* duo / trio) are ALIASES of the same 5L olive oil with a pack        */
/* preselected — /product/duo opens the oil page with ×2 active.       */
/* Prices are placeholders (~€35/5L, "price not final" per the brief). */
/* ------------------------------------------------------------------ */

export type ProductSize = {
  id: string;
  label: string;
  price: number; // unit price in EUR for this size
};

export type PackTier = {
  qty: number;
  discount: number; // fraction, e.g. 0.05
};

export type Product = {
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  sizes: ProductSize[];
  defaultSizeId: string;
  /* Quantity tiers shown as the ×1/×2/×3 pack buttons. Custom amounts are
     always allowed (never limit the client) and inherit the best tier. */
  packs: PackTier[];
  description: string[];
  details: { label: string; value: string }[];
  shipping: string[];
  highlights: string[];
  /* Gallery view captions — placeholder tiles until photography lands. */
  views: string[];
};

const OLIVE_OIL: Product = {
  slug: "extra-virgin-olive-oil",
  name: "Nostrum",
  subtitle: "Extra Virgin Olive Oil",
  category: "Olive Oil",
  sizes: [
    { id: "5l", label: "5L", price: 35 },
    { id: "3l", label: "3L", price: 24 },
    { id: "1l", label: "1L", price: 14 },
    { id: "500ml", label: "500ml", price: 9 },
  ],
  defaultSizeId: "5l",
  packs: [
    { qty: 1, discount: 0 },
    { qty: 2, discount: 0.05 },
    { qty: 3, discount: 0.1 },
  ],
  description: [
    "Made from early-harvest olives, cold-extracted within hours to preserve maximum flavour, aroma and nutrients.",
    "Smooth, balanced and green. For everyday cooking, dressings and finishing.",
  ],
  details: [
    { label: "Variety", value: "Early harvest, single estate" },
    { label: "Extraction", value: "Cold-extracted, first press" },
    { label: "Acidity", value: "≤ 0.3%" },
    { label: "Origin", value: "Product of Spain" },
    { label: "Keep", value: "Cool and dark, away from light" },
  ],
  shipping: [
    "Shipped across Spain and the EU in 2–4 working days.",
    "Bottled to order and packed in protective, recyclable packaging.",
    "14-day returns on unopened bottles — money back.",
  ],
  highlights: [
    "100% Extra Virgin Olive Oil",
    "Cold extracted",
    "Early harvest",
    "Single estate",
    "Product of Spain",
  ],
  views: ["Bottle", "Label", "The grove", "The estate"],
};

/* Every route the shop links to — tile slugs preselect a pack qty. */
const CATALOG: Record<string, { product: Product; qty: number }> = {
  single: { product: OLIVE_OIL, qty: 1 },
  duo: { product: OLIVE_OIL, qty: 2 },
  trio: { product: OLIVE_OIL, qty: 3 },
  [OLIVE_OIL.slug]: { product: OLIVE_OIL, qty: 1 },
};

export function getCatalogEntry(id: string) {
  return CATALOG[id] ?? null;
}

export function getProduct(slug: string): Product | null {
  return CATALOG[slug]?.product ?? null;
}

/* Best discount tier the quantity qualifies for (custom amounts included —
   ×7 still earns the ×3 tier; we never cap what they can buy). */
export function tierFor(product: Product, qty: number): PackTier {
  let best = product.packs[0] ?? { qty: 1, discount: 0 };
  for (const tier of product.packs) if (qty >= tier.qty) best = tier;
  return best;
}

export function lineTotal(product: Product, sizeId: string, qty: number) {
  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  return size.price * qty * (1 - tierFor(product, qty).discount);
}

/* European price formatting — "€35,00", as in the client's mock. */
export function formatEuro(value: number) {
  return "€" + value.toFixed(2).replace(".", ",");
}
