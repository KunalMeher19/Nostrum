"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "../LocaleContext/LocaleContext";
import "./cookie-banner.css";

/**
 * CookieBanner — quiet consent card, bottom-left.
 *
 * Designed to read as part of the site, not a GDPR popup: warm ivory plate,
 * hairline olive keyline, small gold eyebrow, editorial type. "Almost
 * invisible until noticed."
 *
 * Choreography (shows first, before the Journal modal):
 *  - Waits for `.crisp-header.is--loading` to clear (home loader).
 *  - Then waits briefly before sliding up. The notice must not be hidden
 *    indefinitely just because a first-time visitor starts scrolling.
 *  - PERSISTS until user explicitly accepts/rejects — will reappear on
 *    every page load until a choice is made.
 *  - The Journal (newsletter) modal waits for the cookie banner to be
 *    dismissed before showing, so the two never stack.
 *
 * The choice is real consent state, stored in localStorage. Analytics is
 * never loaded unless the visitor opts in. Preferences can also be reopened
 * after a decision, so consent can be withdrawn as easily as it was given.
 */

const CHOICE_KEY = "nostrum-cookie-choice";
/** Fired on window whenever a consent choice is made (detail: the choice).
 *  Analytics listens so GA can load the moment "accept" is clicked. */
export const CONSENT_EVENT = "nostrum-consent";
export const CONSENT_PREFERENCES_EVENT = "nostrum-consent-preferences";
const SHOW_DELAY_MS = 2500;
const POLL_MS = 400; // loader / idle check cadence
const EXIT_MS = 500; // keep in sync with --ck-out in the CSS

export default function CookieBanner() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const didOpen = useRef(false);

  /* ---- Arm: loader gone → idle → show ----------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user has already made a choice - if yes, don't show banner
    let hasChoice = false;
    try {
      hasChoice = !!localStorage.getItem(CHOICE_KEY);
    } catch {
      /* storage unavailable — still show, just not remembered */
    }

    const openPreferences = () => {
      let choice: string | null = null;
      try {
        choice = localStorage.getItem(CHOICE_KEY);
      } catch {
        // Storage being blocked should not prevent the visitor from choosing.
      }
      setAnalyticsEnabled(choice === "accept");
      setPreferencesOpen(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_PREFERENCES_EVENT, openPreferences);

    // Returning visitors only need the listener above, not a new prompt.
    if (hasChoice) {
      return () => window.removeEventListener(CONSENT_PREFERENCES_EVENT, openPreferences);
    }

    const loaderActive = () =>
      !!document.querySelector(".crisp-header.is--loading");
    const showAt = performance.now() + SHOW_DELAY_MS;

    const poll = setInterval(() => {
      if (loaderActive()) {
        return;
      }
      if (performance.now() >= showAt && !didOpen.current) {
        clearInterval(poll);
        didOpen.current = true;
        setOpen(true);
      }
    }, POLL_MS);

    return () => {
      clearInterval(poll);
      window.removeEventListener(CONSENT_PREFERENCES_EVENT, openPreferences);
    };
  }, []);

  /* ---- Dismiss with slide-down fade -------------------------------------- */
  const dismiss = useCallback((choice: string) => {
    try {
      localStorage.setItem(CHOICE_KEY, choice);
    } catch {
      /* ignore */
    }
    if (choice !== "accept") {
      // Remove first-party GA cookies when consent is refused or withdrawn.
      document.cookie.split(";").forEach((item) => {
        const name = item.trim().split("=")[0];
        if (name === "_ga" || name.startsWith("_ga_")) {
          document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
        }
      });
    }
    // Let consent-gated scripts (Analytics) react immediately.
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
    setPreferencesOpen(false);
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      setOpen(false);
      return;
    }
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, EXIT_MS);
  }, []);

  const savePreferences = useCallback(() => {
    dismiss(analyticsEnabled ? "accept" : "reject");
  }, [analyticsEnabled, dismiss]);

  if (!open) return null;

  return (
    <aside
      className={`ck-banner ${closing ? "is--closing" : ""}`}
      role="region"
      aria-label={t("cookie.aria")}
    >
      <p className="ck-banner__eyebrow">{t("cookie.title")}</p>

      <p className="ck-banner__text">
        {t("cookie.description")}
      </p>

      {preferencesOpen ? (
        <div className="ck-banner__preferences">
          <label className="ck-banner__toggle">
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(event) => setAnalyticsEnabled(event.target.checked)}
            />
            <span>{t("cookie.analytics")}</span>
          </label>
          <p className="ck-banner__preference-note">
            {t("cookie.essential")}
          </p>
          <div className="ck-banner__actions">
            <button type="button" className="ck-banner__btn ck-banner__btn--accept" onClick={savePreferences}>
              {t("cookie.accept")}
            </button>
            <button type="button" className="ck-banner__btn ck-banner__btn--ghost" onClick={() => dismiss("reject")}>
              {t("cookie.reject")}
            </button>
          </div>
        </div>
      ) : <div className="ck-banner__actions">
        <button
          type="button"
          className="ck-banner__btn ck-banner__btn--accept"
          onClick={() => dismiss("accept")}
        >
          {t("cookie.accept")}
        </button>
        <button
          type="button"
          className="ck-banner__btn ck-banner__btn--ghost"
          onClick={() => setPreferencesOpen(true)}
        >
          {t("cookie.preferences")}
        </button>
        <button
          type="button"
          className="ck-banner__btn ck-banner__btn--ghost"
          onClick={() => dismiss("reject")}
        >
          {t("cookie.reject")}
        </button>
      </div>}
    </aside>
  );
}
