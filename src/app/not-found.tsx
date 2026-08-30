import Link from "next/link";
import "@/components/NotFound/not-found.css";

/* ------------------------------------------------------------------ */
/* Root 404 handler — Simple version without locale context           */
/* ------------------------------------------------------------------ */

export default function RootNotFound() {
  return (
    <main className="not-found">
      <div className="not-found__container">
        {/* Left: Editorial content */}
        <div className="not-found__content">
          <h1 className="not-found__code">404</h1>
          <h2 className="not-found__title">
            This page could not be found.
          </h2>
          <p className="not-found__message">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="not-found__actions">
            <Link href="/en" className="not-found__btn-primary">
              Return to homepage
            </Link>
            <Link href="/en/shop" className="not-found__btn-secondary">
              Browse our collection
            </Link>
          </div>
        </div>

        {/* Right: Product hero - premium Nostrum composition */}
        <div className="not-found__hero">
          <img
            src="/images/404-hero-final.png"
            alt="Nostrum Extra Virgin Olive Oil"
            className="not-found__hero-image"
          />
        </div>
      </div>

      {/* Trust elements strip */}
      <div className="not-found__trust">
        <div className="not-found__trust-item">
          <div className="not-found__trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="not-found__trust-label">Premium Quality</div>
          <div className="not-found__trust-detail">100% authentic extra virgin olive oil</div>
        </div>

        <div className="not-found__trust-item">
          <div className="not-found__trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="not-found__trust-label">Sourced with care</div>
          <div className="not-found__trust-detail">Handpicked from our groves in your table</div>
        </div>

        <div className="not-found__trust-item">
          <div className="not-found__trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="not-found__trust-label">Rooted in tradition</div>
          <div className="not-found__trust-detail">Timeless craftsmanship in every drop</div>
        </div>
      </div>

      {/* Help CTA */}
      <div className="not-found__help">
        <h3 className="not-found__help-title">Need help finding something?</h3>
        <p className="not-found__help-subtitle">We're here to help you find the perfect olive oil.</p>
        <Link href="/en/contact" className="not-found__help-btn">
          <span>Contact us</span>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
            <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
