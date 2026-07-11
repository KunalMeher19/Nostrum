import type { Metadata } from "next";
import Link from "next/link";
import "./products.css";

export const metadata: Metadata = {
  title: "Products — Nostrum",
  description:
    "The Nostrum collection. Extra virgin olive oil, bottled with intent.",
};

/**
 * Products listing — intentionally EMPTY for now. Both the home "Explore
 * products" CTAs land here; the catalogue (big images, price, quick add-to-cart
 * on hover — NOSTRUM-DESIGN §5) is built later. Until then this renders a
 * quiet, branded empty state rather than a blank route.
 */
export default function ProductsPage() {
  return (
    <main data-main className="products">
      <div className="products__inner">
        <header className="products__head">
          <p className="products__eyebrow">The collection</p>
          <h1 className="products__title">Products</h1>
        </header>

        <section className="products__empty" aria-live="polite">
          <p className="products__empty-line">The collection is being bottled.</p>
          <Link href="/" className="products__back">
            ← Back to home
          </Link>
        </section>
      </div>
    </main>
  );
}
