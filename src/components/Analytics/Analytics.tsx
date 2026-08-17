"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_EVENT } from "../CookieBanner/CookieBanner";

/**
 * Analytics — consent-aware GA4 loader (NOSTRUM-DESIGN §16).
 *
 * GDPR/LSSI-CE: analytics respects user consent choice:
 *   - NEXT_PUBLIC_GA_ID must be set (unset today; no-op until the client
 *     provides a GA4 property), and
 *   - If cookie choice is "accept": loads full GA4 with user tracking
 *   - If cookie choice is "reject" or "preferences": loads basic GA4
 *     (anonymized only, no user identifiers, no remarketing)
 *   - If NO choice yet: waits for the banner
 *
 * This way even users who reject get basic, non-sensitive site analytics
 * (page views, referrers, device types) without personal tracking.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CHOICE_KEY = "nostrum-cookie-choice"; // matches CookieBanner

export default function Analytics() {
  const [consentLevel, setConsentLevel] = useState<"none" | "basic" | "full">("none");

  useEffect(() => {
    try {
      const choice = localStorage.getItem(CHOICE_KEY);
      if (choice === "accept") {
        setConsentLevel("full");
      } else if (choice === "reject" || choice === "preferences") {
        setConsentLevel("basic");
      }
    } catch {
      /* storage unavailable: treat as no consent */
    }
    const onConsent = (e: Event) => {
      const choice = (e as CustomEvent).detail;
      if (choice === "accept") {
        setConsentLevel("full");
      } else if (choice === "reject" || choice === "preferences") {
        setConsentLevel("basic");
      }
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!GA_ID || consentLevel === "none") return null;

  // Full consent: all GA4 features
  if (consentLevel === "full") {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init-full" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              anonymize_ip: true,
              allow_google_signals: true,
              allow_ad_personalization_signals: true
            });
          `}
        </Script>
      </>
    );
  }

  // Basic consent: minimal analytics only (no user tracking)
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init-basic" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            client_storage: 'none',
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
