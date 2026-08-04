"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_EVENT } from "../CookieBanner/CookieBanner";

/**
 * Analytics — consent-gated GA4 loader (NOSTRUM-DESIGN §16).
 *
 * GDPR/LSSI-CE: analytics may only fire AFTER the visitor accepts the
 * cookie banner. This renders nothing unless BOTH are true:
 *   - NEXT_PUBLIC_GA_ID is set (unset today; no-op until the client
 *     provides a GA4 property), and
 *   - the stored cookie choice is "accept" (listens for the banner's
 *     consent event so accepting loads GA without a refresh).
 *
 * Reject/preferences load nothing. IP anonymization is on.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CHOICE_KEY = "nostrum-cookie-choice"; // matches CookieBanner

export default function Analytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CHOICE_KEY) === "accept") setConsented(true);
    } catch {
      /* storage unavailable: treat as no consent */
    }
    const onConsent = (e: Event) => {
      if ((e as CustomEvent).detail === "accept") setConsented(true);
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!GA_ID || !consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
