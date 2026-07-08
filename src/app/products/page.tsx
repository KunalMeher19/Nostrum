import type { Metadata } from "next";
import Link from "next/link";
import "./products.css";

export const metadata: Metadata = {
  title: "Products — Nostrum",
  description:
    "The Nostrum collection. Extra virgin olive oil, bottled with intent.",
};

/**
 * Products listing. The catalogue is empty for now — this renders a branded
 * empty state rather than a blank grid, so the route feels intentional until
 * products are added. When products exist, replace the empty state with the
 * product grid (see NOSTRUM-DESIGN §5 — big images, minimal text, price,
 * quick add-to-cart on hover).
 */
const products: Array<{ slug: string; name: string }> = [];

export default function ProductsPage() {
  return (
    <main data-main className="products">
      <div className="products__inner">
        <header className="products__head">
          <p className="products__eyebrow">The collection</p>
          <h1 className="products__title">Products</h1>
        </header>

        {products.length === 0 ? (
          <section className="products__empty" aria-live="polite">
            <p className="products__empty-line">
              The collection is being bottled.
            </p>
            <p className="products__empty-sub">
              Our oils are not yet listed here. Return soon — or explore the
              story behind Nostrum in the meantime.
            </p>
            <Link href="/" className="products__back">
              ← Back to home
            </Link>
          </section>
        ) : (
          <section className="products__grid">
            {/* Product cards render here once the catalogue is populated. */}
          </section>
        )}
      </div>
    </main>
  );
}
