"use client";

import { useLocale } from "@/components/LocaleContext/LocaleContext";
import { LocaleLink } from "@/components/LocaleContext/LocaleLink";
import "./not-found.css";

/* ------------------------------------------------------------------ */
/* 404 Not Found — Premium editorial layout with product hero and     */
/* brand trust elements. Light Shop aesthetic.                         */
/* ------------------------------------------------------------------ */

export default function NotFoundSection() {
  const { t } = useLocale();

  return (
    <main className="not-found">
      <div className="not-found__container">
        {/* Left: Editorial content */}
        <div className="not-found__content">
          <h1 className="not-found__code">404</h1>
          <h2 className="not-found__title">
            {t("notfound.title")}
          </h2>
          <p className="not-found__message">
            {t("notfound.message")}
          </p>
          <div className="not-found__actions">
            <LocaleLink href="/" className="not-found__btn-primary">
              {t("notfound.return_home")}
            </LocaleLink>
            <LocaleLink href="/shop" className="not-found__btn-secondary">
              {t("notfound.browse_collection")}
            </LocaleLink>
          </div>
        </div>

        {/* Right: Product hero with olive branch */}
        <div className="not-found__hero">
          <div className="not-found__product">
            <img
              src="/images/1.png"
              alt="Nostrum Extra Virgin Olive Oil"
              className="not-found__bottle"
            />
            <svg
              viewBox="0 0 120 180"
              className="not-found__branch"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M60 10 Q 70 40, 80 60 T 90 90 Q 95 120, 90 150"
                stroke="#6AAB1E"
                strokeWidth="2"
                fill="none"
              />
              <ellipse cx="50" cy="30" rx="8" ry="4" fill="#6AAB1E" opacity="0.8" />
              <ellipse cx="75" cy="50" rx="9" ry="5" fill="#6AAB1E" opacity="0.7" />
              <ellipse cx="55" cy="70" rx="7" ry="4" fill="#6AAB1E" opacity="0.8" />
              <ellipse cx="85" cy="85" rx="10" ry="5" fill="#6AAB1E" opacity="0.7" />
              <ellipse cx="65" cy="105" rx="8" ry="4" fill="#6AAB1E" opacity="0.8" />
              <ellipse cx="95" cy="125" rx="9" ry="5" fill="#6AAB1E" opacity="0.7" />
              <ellipse cx="75" cy="145" rx="7" ry="4" fill="#6AAB1E" opacity="0.8" />
            </svg>
          </div>
          <div className="not-found__stone" />
          <div className="not-found__olives">
            <div className="not-found__olive" />
            <div className="not-found__olive" />
          </div>
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
          <div className="not-found__trust-label">{t("notfound.trust_quality")}</div>
          <div className="not-found__trust-detail">{t("notfound.trust_quality_desc")}</div>
        </div>

        <div className="not-found__trust-item">
          <div className="not-found__trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="not-found__trust-label">{t("notfound.trust_sourced")}</div>
          <div className="not-found__trust-detail">{t("notfound.trust_sourced_desc")}</div>
        </div>

        <div className="not-found__trust-item">
          <div className="not-found__trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="not-found__trust-label">{t("notfound.trust_tradition")}</div>
          <div className="not-found__trust-detail">{t("notfound.trust_tradition_desc")}</div>
        </div>
      </div>

      {/* Help CTA */}
      <div className="not-found__help">
        <h3 className="not-found__help-title">{t("notfound.help_title")}</h3>
        <p className="not-found__help-subtitle">{t("notfound.help_subtitle")}</p>
        <LocaleLink href="/contact" className="not-found__help-btn">
          <span>{t("notfound.contact_us")}</span>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
            <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
          </svg>
        </LocaleLink>
      </div>
    </main>
  );
}
