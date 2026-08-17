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

export type OilType = {
  id: string;
  label: string;
  image: string;
};

export type ProductSize = {
  id: string;
  label: string;
  price: number; // unit price in EUR for this size
  image?: string;      // primary photo for this size
  altImage?: string;   // secondary photo (shown alongside primary)
  oilTypes?: OilType[]; // sub-variants (2L has Picual and Arbequina)
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
    {
      id: "5l",
      label: "5L",
      price: 35,
      image: "/products/1.webp",
      altImage: "/products/11.webp",
    },
    {
      id: "2l",
      label: "2L",
      price: 16,
      image: "/products/4.webp",
      oilTypes: [
        { id: "picual", label: "Picual", image: "/products/4.webp" },
        { id: "arbequina", label: "Arbequina", image: "/products/14.webp" },
      ],
    },
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
    "14-day returns on unopened bottles, money back.",
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
  "two-litre": { product: OLIVE_OIL, qty: 1 },
  "2l": { product: OLIVE_OIL, qty: 1 },
  "nostrum-2l": { product: OLIVE_OIL, qty: 1 },
  "extra-virgin-olive-oil-2l": { product: OLIVE_OIL, qty: 1 },
  "extra-virgin-olive-oil-5l": { product: OLIVE_OIL, qty: 1 },
  "extra-virgin-olive-oil-duo": { product: OLIVE_OIL, qty: 2 },
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

/* Primary photo for a size — cart rows/thumbnails. Same fallback as lineTotal. */
export function sizeImage(product: Product, sizeId: string): string | null {
  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  return size.image ?? null;
}

export function tileImage(id: string): string | null {
  const entry = CATALOG[id];
  if (!entry) return null;
  return sizeImage(entry.product, entry.product.defaultSizeId);
}

/* European price formatting — "€35,00", as in the client's mock. */
export function formatEuro(value: number) {
  return "€" + value.toFixed(2).replace(".", ",");
}

/* ------------------------------------------------------------------ */
/* Collection tiles — the Single/Duo/Trio trio the home teaser, the     */
/* /products listing, and the cart's "from the collection" suggestions  */
/* all share. Keys resolve through i18n; prices are computed from the   */
/* catalog (pack tiers included) so a price change propagates.          */
/* ------------------------------------------------------------------ */

export const COLLECTION_TILES = [
  { id: "single", nameKey: "shop.product_single", detailKey: "shop.detail_single" },
  { id: "duo", nameKey: "shop.product_duo", detailKey: "shop.detail_duo" },
  { id: "trio", nameKey: "shop.product_trio", detailKey: "shop.detail_trio" },
] as const;

/* Full price of a catalog tile (default size × preselected pack qty,
   tier discount applied). Null for unknown ids. */
export function tilePrice(id: string): number | null {
  const entry = CATALOG[id];
  if (!entry) return null;
  const size =
    entry.product.sizes.find((s) => s.id === entry.product.defaultSizeId) ??
    entry.product.sizes[0];
  return lineTotal(entry.product, size.id, entry.qty);
}
