"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./newsletter-modal.css";
import { getLenis } from "../SmoothScroll/lenisStore";

/**
 * NewsletterModal — "The Nostrum Journal" subscription invitation.
 *
 * A split-screen editorial modal (copy left, product photography right) that
 * fades in ~1min AFTER the loading screen has finished — never over the loader
 * intro. It reads as joining a private olive-oil journal, not a marketing
 * popup: warm paper panel, hairline borders, gold accents, generous space.
 *
 * Behaviour:
 *  - Waits for `.crisp-header.is--loading` to clear (home loader), then 1min.
 *    On pages without the loader the countdown starts immediately.
 *  - Shows once per browser session (sessionStorage), and never again once
 *    subscribed (localStorage).
 *  - ESC, backdrop click, and the ✕ all close. Scroll is paused while open
 *    (Lenis stop/start — restored only if it was running before).
 *  - Entrance: overlay fades, panel scales 0.98 → 1; content cascades in.
 *    Reduced-motion gets an instant, animation-free show/hide.
 */

const SESSION_KEY = "nostrum-journal-shown";
const SUBSCRIBED_KEY = "nostrum-journal-subscribed";
// Feedback 2.0: "I know I said 5 seconds but it might be better in a minute."
const DELAY_AFTER_LOAD_MS = 60_000;
const LOADER_POLL_MS = 250;

export default function NewsletterModal() {
  const [open, setOpen] = useState(false);
  // "idle" → "sending" → "done"
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  // Whether Lenis was already stopped when we opened (home slideshow keeps it
  // stopped on purpose) — only restart on close if WE stopped it.
  const lenisWasRunning = useRef(false);

  /* ---- Arm the timer: loader gone → 5s → open --------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (
        sessionStorage.getItem(SESSION_KEY) ||
        localStorage.getItem(SUBSCRIBED_KEY)
      ) {
        return;
      }
    } catch {
      /* storage unavailable (private mode) — still show, just not gated */
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const arm = () => {
      if (cancelled) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        setOpen(true);
      }, DELAY_AFTER_LOAD_MS);
    };

    // The home hero keeps `.crisp-header.is--loading` on for the whole intro;
    // poll until it clears. Pages without the hero arm immediately.
    const loaderActive = () =>
      !!document.querySelector(".crisp-header.is--loading");

    if (!loaderActive()) {
      arm();
    } else {
      poll = setInterval(() => {
        if (!loaderActive()) {
          if (poll) clearInterval(poll);
          poll = null;
          arm();
        }
      }, LOADER_POLL_MS);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (poll) clearInterval(poll);
    };
  }, []);

  /* ---- Open side-effects: scroll pause + ESC + focus -------------------- */
  useEffect(() => {
    if (!open) return;

    const lenis = getLenis();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lenisWasRunning.current = !!lenis && !(lenis as any).isStopped;
    if (lenisWasRunning.current) lenis?.stop();

    // Move focus into the dialog so ESC + tabbing work immediately, without
    // the keyboard popping on mobile (focus the panel, not the input).
    panelRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (lenisWasRunning.current) getLenis()?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ---- Close with fade-out ---------------------------------------------- */
  const requestClose = useCallback(() => {
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      setOpen(false);
      return;
    }
    setClosing(true);
    // Matches --nl-out duration in the CSS.
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 450);
  }, []);

  /* ---- Submit ------------------------------------------------------------ */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("sending");
    // No mail backend is wired yet — hold a beat so the state change feels
    // deliberate, then land on the welcome note. Swap for a real POST later.
    setTimeout(() => {
      setStatus("done");
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 900);
  };

  if (!open) return null;

  return (
    <div
      className={`nl-modal ${closing ? "is--closing" : ""}`}
      role="presentation"
      onMouseDown={(e) => {
        // Backdrop click closes — only when the press started on the overlay
        // itself, so drags that end outside the panel don't dismiss it.
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        className="nl-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nl-modal-title"
        tabIndex={-1}
      >
        {/* ---- Left: the invitation ---- */}
        <div className="nl-modal__content">
          <p className="nl-modal__eyebrow">The Nostrum Journal</p>

          {status !== "done" ? (
            <>
              <h2 className="nl-modal__title" id="nl-modal-title">
                Receive stories
                <br />
                from the grove
              </h2>
              <p className="nl-modal__sub">
                New harvest updates, exclusive releases and recipes,
                and&nbsp;5% off your first order.
              </p>

              <form className="nl-modal__form" onSubmit={onSubmit}>
                <div className="nl-modal__field">
                  <input
                    ref={emailRef}
                    className="nl-modal__input"
                    type="email"
                    name="email"
                    required
                    placeholder="Email address"
                    aria-label="Email address"
                    autoComplete="email"
                  />
                </div>

                <label className="nl-modal__consent">
                  <input
                    type="checkbox"
                    required
                    className="nl-modal__checkbox"
                  />
                  <span className="nl-modal__checkmark" aria-hidden="true" />
                  <span className="nl-modal__consent-text">
                    I agree to the <u>Privacy&nbsp;Policy</u>
                  </span>
                </label>

                <button
                  type="submit"
                  className="nl-modal__cta"
                  disabled={status === "sending"}
                >
                  <span className="nl-modal__cta-label">
                    {status === "sending" ? "One moment…" : "Join the Journal"}
                  </span>
                </button>
              </form>
            </>
          ) : (
            <div className="nl-modal__done">
              <h2 className="nl-modal__title" id="nl-modal-title">
                Welcome to
                <br />
                the Journal
              </h2>
              <p className="nl-modal__sub">
                Your 5% welcome offer is on its way. Until the next
                harvest.
              </p>
              <button
                type="button"
                className="nl-modal__cta"
                onClick={requestClose}
              >
                <span className="nl-modal__cta-label">Continue</span>
              </button>
            </div>
          )}
        </div>

        {/* ---- Right: editorial product photography ---- */}
        <div className="nl-modal__media" aria-hidden="true">
          <img
            className="nl-modal__img"
            src="/products/12.webp"
            alt=""
            draggable="false"
          />
          {/* Warm veil — blends the packshot's cool studio grey into the
              panel's warm paper so the two halves read as one surface. */}
          <span className="nl-modal__media-veil" />
        </div>

        <button
          type="button"
          className="nl-modal__close"
          aria-label="Close"
          onClick={requestClose}
        >
          <span className="nl-modal__close-x" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
