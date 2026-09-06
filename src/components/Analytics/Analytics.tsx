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
 *   - GA4 loads only when the cookie choice is "accept"
 *   - If NO choice yet: waits for the banner
 *
 * A refusal means no analytics request or analytics cookie is created.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CHOICE_KEY = "nostrum-cookie-choice"; // matches CookieBanner

export default function Analytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    try {
      const choice = localStorage.getItem(CHOICE_KEY);
      if (choice === "accept") {
        setHasConsent(true);
      }
    } catch {
      /* storage unavailable: treat as no consent */
    }
    const onConsent = (e: Event) => {
      const choice = (e as CustomEvent).detail;
      if (choice === "accept") {
        setHasConsent(true);
      } else {
        // A visitor may withdraw an earlier choice in Preferences. Tell an
        // already-loaded GA instance to stop using storage immediately.
        const analyticsWindow = window as typeof window & {
          gtag?: (...args: unknown[]) => void;
        };
        analyticsWindow.gtag?.("consent", "update", { analytics_storage: "denied" });
        setHasConsent(false);
      }
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!GA_ID || !hasConsent) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
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
