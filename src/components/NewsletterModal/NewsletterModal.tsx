"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./newsletter-modal.css";
import { getLenis } from "../SmoothScroll/lenisStore";
import { useLocale } from "../LocaleContext/LocaleContext";
import { subscribeNewsletter } from "@/lib/api";

/**
 * NewsletterModal — "The Nostrum Journal" subscription invitation.
 *
 * A split-screen editorial modal (copy left, product photography right) that
 * fades in after the cookie consent banner has been dismissed AND a further
 * delay — never while the cookie banner is still on screen.
 *
 * Behaviour:
 *  - Waits for `.crisp-header.is--loading` to clear (home loader).
 *  - Waits for the cookie consent banner to be dismissed (the user must
 *    accept/reject cookies first). If cookies were already chosen in a
 *    previous visit, this step is instant.
 *  - Then waits DELAY_AFTER_CONSENT_MS before opening.
 *  - Keeps showing on every visit until the user actually subscribes
 *    (localStorage). Dismissing without subscribing just closes for now —
 *    it will return on the next page load / session.
 *  - ESC, backdrop click, and the ✕ all close. Scroll is paused while open
 *    (Lenis stop/start — restored only if it was running before).
 *  - Entrance: overlay fades, panel scales 0.98 → 1; content cascades in.
 *    Reduced-motion gets an instant, animation-free show/hide.
 */

const SUBSCRIBED_KEY = "nostrum-journal-subscribed";
const COOKIE_CHOICE_KEY = "nostrum-cookie-choice";
// Delay after cookie consent is dismissed before showing the modal
const DELAY_AFTER_CONSENT_MS = 22_000;
const LOADER_POLL_MS = 250;

export default function NewsletterModal() {
  const [open, setOpen] = useState(false);
  // "idle" → "sending" → "done" ("error" returns to a retryable form)
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const { t, locale } = useLocale();
  // Whether Lenis was already stopped when we opened (home slideshow keeps it
  // stopped on purpose) — only restart on close if WE stopped it.
  const lenisWasRunning = useRef(false);

  /* ---- Arm: loader gone → cookie consent settled → delay → open --------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY)) {
        return;
      }
    } catch {
      /* storage unavailable (private mode) — still show, just not gated */
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let consentListener: (() => void) | null = null;
    let cancelled = false;

    const showModal = () => {
      if (cancelled) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        setOpen(true);
      }, DELAY_AFTER_CONSENT_MS);
    };

    const waitForConsent = () => {
      if (cancelled) return;

      // If the user already made a cookie choice (returning visitor), skip waiting
      let hasChoice = false;
      try {
        hasChoice = !!localStorage.getItem(COOKIE_CHOICE_KEY);
      } catch {
        // Storage unavailable — assume consent is handled
        hasChoice = true;
      }

      if (hasChoice) {
        showModal();
        return;
      }

      // Listen for the cookie consent event (fired when user clicks accept/reject/preferences)
      const handler = () => {
        if (consentListener) {
          window.removeEventListener("nostrum-consent", handler);
          consentListener = null;
        }
        showModal();
      };
      consentListener = handler;
      window.addEventListener("nostrum-consent", handler);
    };

    // The home hero keeps `.crisp-header.is--loading` on for the whole intro;
    // poll until it clears. Pages without the hero proceed immediately.
    const loaderActive = () =>
      !!document.querySelector(".crisp-header.is--loading");

    if (!loaderActive()) {
      waitForConsent();
    } else {
      poll = setInterval(() => {
        if (!loaderActive()) {
          if (poll) clearInterval(poll);
          poll = null;
          waitForConsent();
        }
      }, LOADER_POLL_MS);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (poll) clearInterval(poll);
      if (consentListener) {
        window.removeEventListener("nostrum-consent", consentListener);
      }
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
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending" || status === "done") return;
    const email = emailRef.current?.value.trim() ?? "";
    if (!email) return;
    setStatus("sending");
    try {
      // GDPR: the consent checkbox is required by the form, so reaching
      // here means it is checked. The backend stores consentAt + sends
      // the welcome mail (console stub) with the unsubscribe link.
      await subscribeNewsletter({ email, consent: true, locale });
      setStatus("done");
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "1");
        sessionStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {
        /* ignore */
      }
    } catch {
      setStatus("error");
    }
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
          <p className="nl-modal__eyebrow">{t("newsletter.eyebrow")}</p>

          {status !== "done" ? (
            <>
              <h2 className="nl-modal__title" id="nl-modal-title">
                {t("newsletter.title_1")}
                <br />
                {t("newsletter.title_2")}
              </h2>
              <p className="nl-modal__sub">{t("newsletter.sub")}</p>

              <form className="nl-modal__form" onSubmit={onSubmit}>
                <div className="nl-modal__field">
                  <input
                    ref={emailRef}
                    className="nl-modal__input"
                    type="email"
                    name="email"
                    required
                    placeholder={t("newsletter.placeholder")}
                    aria-label={t("newsletter.placeholder")}
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
                    {t("newsletter.consent_pre")}{" "}
                    <u>{t("newsletter.consent_link")}</u>
                  </span>
                </label>

                <button
                  type="submit"
                  className="nl-modal__cta"
                  disabled={status === "sending"}
                >
                  <span className="nl-modal__cta-label">
                    {status === "sending"
                      ? t("newsletter.sending")
                      : t("newsletter.join")}
                  </span>
                </button>
                {status === "error" && (
                  <p className="nl-modal__error" role="alert">
                    {t("newsletter.error")}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="nl-modal__done">
              <h2 className="nl-modal__title" id="nl-modal-title">
                {t("newsletter.done_title_1")}
                <br />
                {t("newsletter.done_title_2")}
              </h2>
              <p className="nl-modal__sub">{t("newsletter.done_sub")}</p>
              <button
                type="button"
                className="nl-modal__cta"
                onClick={requestClose}
              >
                <span className="nl-modal__cta-label">
                  {t("newsletter.continue")}
                </span>
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
          aria-label={t("newsletter.close")}
          onClick={requestClose}
        >
          <span className="nl-modal__close-x" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
