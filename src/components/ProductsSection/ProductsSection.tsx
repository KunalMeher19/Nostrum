import "./products-section.css";

/**
 * ProductsSection — the in-page destination the "Products" nav link scrolls to.
 *
 * This is a deliberate placeholder: the real collection layout (big imagery,
 * price, quick add — see NOSTRUM-DESIGN §5) is designed later. For now it gives
 * the sidebar's Products link a real scroll target on the landing page (id
 * "products"), mirroring the branded empty state of the /products route so the
 * section reads as intentional rather than blank.
 */
export default function ProductsSection() {
  return (
    <section id="products" className="products-section" aria-label="Products">
      <div className="products-section__inner">
        <p className="products-section__eyebrow">The collection</p>
        <h2 className="products-section__title">Products</h2>
        <p className="products-section__line">The collection is being bottled.</p>
        <p className="products-section__sub">
          Our oils are not yet listed here. This is where the collection will
          live — coming soon.
        </p>
      </div>
    </section>
  );
}
