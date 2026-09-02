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
 *  - Then waits for a quiet moment: no pointer / scroll / key activity
 *    for IDLE_MS before sliding up. Any interaction resets the clock, so
 *    it only ever appears while the visitor is at rest.
 *  - PERSISTS until user explicitly accepts/rejects — will reappear on
 *    every page load until a choice is made.
 *  - The Journal (newsletter) modal waits for the cookie banner to be
 *    dismissed before showing, so the two never stack.
 *
 * The legal pages aren't ready yet, so Preferences currently behaves as
 * a dismissal. The choice IS real consent state now: it is stored in
 * localStorage. "accept" loads full Analytics; "reject" loads basic
 * (non-sensitive) Analytics only; "preferences" is treated as reject.
 */

const CHOICE_KEY = "nostrum-cookie-choice";
/** Fired on window whenever a consent choice is made (detail: the choice).
 *  Analytics listens so GA can load the moment "accept" is clicked. */
export const CONSENT_EVENT = "nostrum-consent";
const IDLE_MS = 2500; // quiet time required before entering
const POLL_MS = 400; // loader / idle check cadence
const EXIT_MS = 500; // keep in sync with --ck-out in the CSS

export default function CookieBanner() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const lastActivity = useRef(0);

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

    // Only show if NO choice has been made yet
    if (hasChoice) return;

    lastActivity.current = performance.now();
    const touch = () => {
      lastActivity.current = performance.now();
    };
    const activityEvents: (keyof WindowEventMap)[] = [
      "pointermove",
      "pointerdown",
      "wheel",
      "scroll",
      "keydown",
      "touchstart",
    ];
    activityEvents.forEach((ev) =>
      window.addEventListener(ev, touch, { passive: true })
    );

    const loaderActive = () =>
      !!document.querySelector(".crisp-header.is--loading");
    const isIdle = () => performance.now() - lastActivity.current >= IDLE_MS;

    const poll = setInterval(() => {
      if (loaderActive()) {
        // While the loader has the stage, keep resetting the idle clock
        // so we enter a beat AFTER it leaves, not the instant.
        lastActivity.current = performance.now();
        return;
      }
      if (isIdle()) {
        clearInterval(poll);
        setOpen(true);
      }
    }, POLL_MS);

    return () => {
      clearInterval(poll);
      activityEvents.forEach((ev) => window.removeEventListener(ev, touch));
    };
  }, []);

  /* ---- Dismiss with slide-down fade -------------------------------------- */
  const dismiss = useCallback((choice: string) => {
    try {
      localStorage.setItem(CHOICE_KEY, choice);
    } catch {
      /* ignore */
    }
    // Let consent-gated scripts (Analytics) react immediately.
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
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

      <div className="ck-banner__actions">
        {/* "accept" unlocks full Analytics including user identifiers.
            "reject" and "preferences" load basic Analytics only (no user tracking). */}
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
          onClick={() => dismiss("preferences")}
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
      </div>
    </aside>
  );
}
