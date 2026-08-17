"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./cookie-banner.css";

/**
 * CookieBanner — quiet consent card, bottom-left.
 *
 * Designed to read as part of the site, not a GDPR popup: warm ivory plate,
 * hairline olive keyline, small gold eyebrow, editorial type. "Almost
 * invisible until noticed."
 *
 * Choreography (never fights the Journal modal / loader):
 *  - Waits for `.crisp-header.is--loading` to clear (home loader).
 *  - Waits until the NewsletterModal (`.nl-modal`) is NOT in the DOM —
 *    the Journal invitation always gets the stage first.
 *  - Then waits for a quiet moment: no pointer / scroll / key activity
 *    for IDLE_MS before sliding up. Any interaction resets the clock, so
 *    it only ever appears while the visitor is at rest.
 *  - PERSISTS until user explicitly accepts/rejects — will reappear on
 *    every page load until a choice is made.
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
const IDLE_MS = 2500; // quiet time required before entering (reduced for better visibility)
const POLL_MS = 400; // loader / modal / idle check cadence
const EXIT_MS = 500; // keep in sync with --ck-out in the CSS

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const lastActivity = useRef(0);

  /* ---- Arm: loader gone → Journal modal gone → idle → show -------------- */
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
    // The Journal invitation goes first: it is "settled" only once it has
    // taken its turn this session (its session/subscribed key exists) AND
    // it is no longer on screen. Before it opens (the 5s countdown) we keep
    // waiting, so the two never enter together.
    const journalSettled = () => {
      if (document.querySelector(".nl-modal")) return false;
      try {
        return !!(
          sessionStorage.getItem("nostrum-journal-shown") ||
          localStorage.getItem("nostrum-journal-subscribed")
        );
      } catch {
        // Storage unavailable — can't know; don't hold the banner hostage.
        return true;
      }
    };
    const isIdle = () => performance.now() - lastActivity.current >= IDLE_MS;

    const poll = setInterval(() => {
      if (loaderActive() || !journalSettled()) {
        // While the loader or Journal has the stage, keep resetting the
        // idle clock so we enter a beat AFTER they leave, not the instant.
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
      aria-label="Cookie notice"
    >
      <p className="ck-banner__eyebrow">Cookies</p>

      <p className="ck-banner__text">
        We use cookies to improve your browsing experience and to better
        understand how visitors use Nostrum. Choose "Accept" for full analytics,
        or "Reject" for basic (non-sensitive) analytics only.
      </p>

      <div className="ck-banner__actions">
        {/* "accept" unlocks full Analytics including user identifiers.
            "reject" and "preferences" load basic Analytics only (no user tracking). */}
        <button
          type="button"
          className="ck-banner__btn ck-banner__btn--accept"
          onClick={() => dismiss("accept")}
        >
          Accept
        </button>
        <button
          type="button"
          className="ck-banner__btn ck-banner__btn--ghost"
          onClick={() => dismiss("preferences")}
        >
          Preferences
        </button>
        <button
          type="button"
          className="ck-banner__btn ck-banner__btn--ghost"
          onClick={() => dismiss("reject")}
        >
          Reject
        </button>
      </div>
    </aside>
  );
}
